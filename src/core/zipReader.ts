import JSZip from 'jszip'
import type { ScannerContext, VirtualFile } from './types'
import { dirname, isProbablyText, makeVirtualFile, normalizePath } from './virtualFileSystem'

function pickManifestPath(paths: string[]): string | undefined {
  if (paths.includes('manifest.json')) return 'manifest.json'
  return paths.find((path) => path.endsWith('/manifest.json'))
}

function shouldReadBytes(path: string): boolean {
  return /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(path)
}

export async function readExtensionZip(file: File): Promise<ScannerContext> {
  if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('Please choose a .zip file.')

  const zip = await JSZip.loadAsync(file)
  const entries = Object.values(zip.files).filter((entry) => !entry.dir && !normalizePath(entry.name).startsWith('__MACOSX/'))
  const rawPaths = entries.map((entry) => normalizePath(entry.name))
  const manifestPath = pickManifestPath(rawPaths)
  const manifestAtRoot = manifestPath === 'manifest.json'
  const rootPrefix = manifestPath && !manifestAtRoot ? dirname(manifestPath) : ''

  const allFiles: VirtualFile[] = []
  for (const entry of entries) {
    const normalized = normalizePath(entry.name)
    const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0
    let text: string | undefined
    let bytes: Uint8Array | undefined

    if (isProbablyText(normalized, size)) {
      try {
        text = await entry.async('text')
      } catch {
        text = undefined
      }
    }

    if (shouldReadBytes(normalized)) {
      try {
        bytes = await entry.async('uint8array')
      } catch {
        bytes = undefined
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
  }

  const textFiles = allFiles.filter((candidate) => candidate.isText && candidate.text !== undefined)
  const jsFiles = textFiles.filter((candidate) => ['.js', '.mjs', '.cjs'].includes(candidate.extension))
  const htmlFiles = textFiles.filter((candidate) => ['.html', '.htm'].includes(candidate.extension))

  return { zipName: file.name, manifestPath, manifestAtRoot, manifest, manifestParseError, rootPrefix, files, allFiles, textFiles, jsFiles, htmlFiles }
}
