import type { VirtualFile } from './types'

const textExtensions = new Set(['.json', '.js', '.mjs', '.cjs', '.html', '.htm', '.css', '.txt', '.md', '.svg'])

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/\/+/g, '/')
}

export function dirname(path: string): string {
  const normalized = normalizePath(path)
  const index = normalized.lastIndexOf('/')
  return index === -1 ? '' : normalized.slice(0, index + 1)
}

export function stripRootPrefix(path: string, rootPrefix: string): string {
  const normalized = normalizePath(path)
  const normalizedRoot = normalizePath(rootPrefix)
  if (!normalizedRoot) return normalized
  return normalized.startsWith(normalizedRoot) ? normalized.slice(normalizedRoot.length) : normalized
}

export function getExtension(path: string): string {
  const normalized = normalizePath(path).toLowerCase()
  const lastSlash = normalized.lastIndexOf('/')
  const lastDot = normalized.lastIndexOf('.')
  if (lastDot <= lastSlash) return ''
  return normalized.slice(lastDot)
}

export function isProbablyText(path: string, size: number): boolean {
  const extension = getExtension(path)
  if (textExtensions.has(extension)) return true
  return size < 64000 && extension === ''
}

export function makeVirtualFile(params: { path: string; rootPrefix: string; size: number; text?: string }): VirtualFile {
  const normalizedPath = stripRootPrefix(params.path, params.rootPrefix)
  return {
    path: normalizePath(params.path),
    normalizedPath,
    size: params.size,
    extension: getExtension(normalizedPath),
    isText: typeof params.text === 'string',
    text: params.text,
  }
}
