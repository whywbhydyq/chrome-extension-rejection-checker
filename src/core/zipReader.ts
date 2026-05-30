import type { ScannerContext, ScanLimit, VirtualFile } from './types'
import { dirname, isProbablyText, makeVirtualFile, normalizePath } from './virtualFileSystem'

const MAX_ZIP_BYTES = 50 * 1024 * 1024
const MAX_ENTRY_COUNT = 5000
const MAX_TOTAL_UNCOMPRESSED_BYTES = 120 * 1024 * 1024
const MAX_TEXT_FILE_BYTES = 1.5 * 1024 * 1024
const MAX_BINARY_PREVIEW_BYTES = 5 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`
}

function pickManifestPath(paths: string[]): string | undefined {
  if (paths.includes('manifest.json')) return 'manifest.json'
  return paths.find((path) => path.endsWith('/manifest.json'))
}

function shouldReadBytes(path: string, size: number): boolean {
  return size <= MAX_BINARY_PREVIEW_BYTES && /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(path)
}

function getUncompressedSize(entry: unknown): number {
  return (entry as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0
}

function scanLimit(params: Omit<ScanLimit, 'recommendation'> & { recommendation?: string }): ScanLimit {
  return {
    ...params,
    recommendation: params.recommendation ?? 'Review this file manually in your submitted ZIP because the browser scanner intentionally skipped expensive content.',
  }
}

export async function readExtensionZip(file: File): Promise<ScannerContext> {
  if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('Please choose a .zip file.')
  if (file.size > MAX_ZIP_BYTES) {
    throw new Error(`This ZIP is ${formatBytes(file.size)}. Choose a package under ${formatBytes(MAX_ZIP_BYTES)} so the browser scanner can run safely.`)
  }

  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(file)
  const entries = Object.values(zip.files).filter((entry) => !entry.dir && !normalizePath(entry.name).startsWith('__MACOSX/'))

  if (entries.length > MAX_ENTRY_COUNT) {
    throw new Error(`This ZIP contains ${entries.length} files. The local scanner limit is ${MAX_ENTRY_COUNT} files to avoid freezing the browser.`)
  }

  const totalUncompressedSize = entries.reduce((total, entry) => total + getUncompressedSize(entry), 0)
  if (totalUncompressedSize > MAX_TOTAL_UNCOMPRESSED_BYTES) {
    throw new Error(`This ZIP expands to about ${formatBytes(totalUncompressedSize)}. The local scanner limit is ${formatBytes(MAX_TOTAL_UNCOMPRESSED_BYTES)} to reduce zip-bomb risk.`)
  }

  const rawPaths = entries.map((entry) => normalizePath(entry.name))
  const manifestPath = pickManifestPath(rawPaths)
  const manifestAtRoot = manifestPath === 'manifest.json'
  const rootPrefix = manifestPath && !manifestAtRoot ? dirname(manifestPath) : ''

  const scanLimits: ScanLimit[] = []
  const allFiles: VirtualFile[] = []
  for (const entry of entries) {
    const normalized = normalizePath(entry.name)
    const size = getUncompressedSize(entry)
    let text: string | undefined
    let bytes: Uint8Array | undefined

    if (isProbablyText(normalized, size)) {
      if (size <= MAX_TEXT_FILE_BYTES) {
        try {
          text = await entry.async('text')
        } catch {
          scanLimits.push(scanLimit({
            code: 'ZIP_TEXT_READ_FAILED',
            severity: 'low',
            title: 'Text file could not be read',
            file: normalized,
            size,
            reason: 'A probable text file inside the ZIP could not be decoded by the local browser scanner.',
          }))
        }
      } else {
        scanLimits.push(scanLimit({
          code: 'ZIP_TEXT_FILE_SKIPPED',
          severity: 'low',
          title: 'Large text file skipped',
          file: normalized,
          size,
          reason: `This file is ${formatBytes(size)}, above the ${formatBytes(MAX_TEXT_FILE_BYTES)} per-file text scan limit.`,
        }))
      }
    }

    if (shouldReadBytes(normalized, size)) {
      try {
        bytes = await entry.async('uint8array')
      } catch {
        scanLimits.push(scanLimit({
          code: 'ZIP_BINARY_READ_FAILED',
          severity: 'low',
          title: 'Image or binary file could not be read',
          file: normalized,
          size,
          reason: 'A file used for icon or asset checks could not be decoded by the local browser scanner.',
        }))
      }
    }

    allFiles.push(makeVirtualFile({ path: normalized, rootPrefix, size, text, bytes }))
  }

  const files = new Map<string, VirtualFile>()
  for (const virtualFile of allFiles) files.set(virtualFile.normalizedPath, virtualFile)

  const manifestFile = manifestPath ? allFiles.find((candidate) => candidate.path === manifestPath) : undefined
  let manifest: Record<string, unknown> | undefined
  let manifestParseError: string | undefined

  if (manifestFile?.text) {
    try {
      const parsed = JSON.parse(manifestFile.text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) manifest = parsed as Record<string, unknown>
      else manifestParseError = 'manifest.json must contain a JSON object.'
    } catch (error) {
      manifestParseError = error instanceof Error ? error.message : 'Invalid JSON.'
    }
  } else if (manifestPath) {
    manifestParseError = 'manifest.json was found but could not be read by the local scanner.'
  }

  const textFiles = allFiles.filter((candidate) => candidate.isText && candidate.text !== undefined)
  const jsFiles = textFiles.filter((candidate) => ['.js', '.mjs', '.cjs'].includes(candidate.extension))
  const htmlFiles = textFiles.filter((candidate) => ['.html', '.htm'].includes(candidate.extension))

  return { zipName: file.name, manifestPath, manifestAtRoot, manifest, manifestParseError, rootPrefix, files, allFiles, textFiles, jsFiles, htmlFiles, scanLimits }
}
