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

function shouldReadBytes(path: string, size: number | undefined): boolean {
  return typeof size === 'number' && size <= MAX_BINARY_PREVIEW_BYTES && /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(path)
}

function getDeclaredUncompressedSize(entry: unknown): number | undefined {
  const size = (entry as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize
  return typeof size === 'number' && Number.isFinite(size) && size >= 0 ? size : undefined
}

function getTextByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength
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

  const declaredSizes = entries.map((entry) => getDeclaredUncompressedSize(entry))
  const knownTotalUncompressedSize = declaredSizes.reduce((total, size) => total + (size ?? 0), 0)
  const hasUnknownDeclaredSize = declaredSizes.some((size) => size === undefined)
  if (knownTotalUncompressedSize > MAX_TOTAL_UNCOMPRESSED_BYTES) {
    throw new Error(`This ZIP expands to about ${formatBytes(knownTotalUncompressedSize)}. The local scanner limit is ${formatBytes(MAX_TOTAL_UNCOMPRESSED_BYTES)} to reduce zip-bomb risk.`)
  }

  const rawPaths = entries.map((entry) => normalizePath(entry.name))
  const manifestPath = pickManifestPath(rawPaths)
  const manifestAtRoot = manifestPath === 'manifest.json'
  const rootPrefix = manifestPath && !manifestAtRoot ? dirname(manifestPath) : ''

  const scanLimits: ScanLimit[] = []
  if (hasUnknownDeclaredSize) {
    scanLimits.push(scanLimit({
      code: 'ZIP_DECLARED_SIZE_UNKNOWN',
      severity: 'low',
      title: 'Some ZIP entry sizes were not declared',
      reason: 'The ZIP library did not expose a declared uncompressed size for every entry before reading. Unknown-size non-manifest text files are skipped to avoid zip-bomb style memory pressure.',
      recommendation: 'Use the generated report as a static preflight result and manually review any unknown-size files that the browser scanner skipped.',
    }))
  }

  const allFiles: VirtualFile[] = []
  let observedReadBytes = 0
  for (const entry of entries) {
    const normalized = normalizePath(entry.name)
    let size = getDeclaredUncompressedSize(entry)
    let text: string | undefined
    let bytes: Uint8Array | undefined

    if (isProbablyText(normalized, size ?? MAX_TEXT_FILE_BYTES + 1)) {
      const isManifestCandidate = normalized === manifestPath
      if (size === undefined && !isManifestCandidate) {
        scanLimits.push(scanLimit({
          code: 'ZIP_TEXT_FILE_SKIPPED_UNKNOWN_SIZE',
          severity: 'medium',
          title: 'Text file skipped because its expanded size was unknown',
          file: normalized,
          reason: 'The ZIP entry did not expose a declared uncompressed size before reading. To avoid zip-bomb style memory pressure, the browser scanner only reads unknown-size manifest.json entries automatically.',
          recommendation: 'Repackage the extension with normal ZIP metadata or manually review this file in the final submitted package.',
        }))
      } else if (size === undefined || size <= MAX_TEXT_FILE_BYTES) {
        try {
          const decodedText = await entry.async('text')
          const actualTextSize = getTextByteLength(decodedText)
          size = size ?? actualTextSize
          observedReadBytes += actualTextSize
          if (observedReadBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
            throw new Error(`This ZIP decoded more than ${formatBytes(MAX_TOTAL_UNCOMPRESSED_BYTES)} of text content. The local scanner stopped to reduce zip-bomb risk.`)
          }
          if (actualTextSize <= MAX_TEXT_FILE_BYTES) {
            text = decodedText
          } else {
            scanLimits.push(scanLimit({
              code: 'ZIP_TEXT_FILE_SKIPPED_AFTER_DECODE',
              severity: 'low',
              title: 'Large text file skipped after size verification',
              file: normalized,
              size: actualTextSize,
              reason: `This file decoded to ${formatBytes(actualTextSize)}, above the ${formatBytes(MAX_TEXT_FILE_BYTES)} per-file text scan limit.`,
            }))
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('zip-bomb risk')) throw error
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
        const decodedBytes = await entry.async('uint8array')
        observedReadBytes += decodedBytes.byteLength
        if (observedReadBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
          throw new Error(`This ZIP decoded more than ${formatBytes(MAX_TOTAL_UNCOMPRESSED_BYTES)} of content. The local scanner stopped to reduce zip-bomb risk.`)
        }
        bytes = decodedBytes
        size = size ?? decodedBytes.byteLength
      } catch (error) {
        if (error instanceof Error && error.message.includes('zip-bomb risk')) throw error
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

    allFiles.push(makeVirtualFile({ path: normalized, rootPrefix, size: size ?? 0, text, bytes }))
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
