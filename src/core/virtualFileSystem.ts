import type { VirtualFile } from './types'

const textExtensions = new Set(['.json', '.js', '.mjs', '.cjs', '.html', '.htm', '.css', '.txt', '.md', '.svg'])

export type CanonicalPathResult = {
  path: string
  hadTraversal: boolean
  escapedRoot: boolean
  hadLeadingSlash: boolean
}

export function canonicalizePath(path: string): CanonicalPathResult {
  const hadLeadingSlash = /^[/\\]+/.test(path)
  const segments = path.replace(/\\/g, '/').split('/')
  const stack: string[] = []
  let hadTraversal = false
  let escapedRoot = false

  for (const segment of segments) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      hadTraversal = true
      if (stack.length > 0) stack.pop()
      else escapedRoot = true
      continue
    }
    stack.push(segment)
  }

  return {
    path: stack.join('/'),
    hadTraversal,
    escapedRoot,
    hadLeadingSlash,
  }
}

export function normalizePath(path: string): string {
  return canonicalizePath(path).path
}

export function normalizeManifestResourcePath(path: string): CanonicalPathResult {
  return canonicalizePath(path)
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

export function makeVirtualFile(params: { path: string; rootPrefix: string; size: number; text?: string; bytes?: Uint8Array }): VirtualFile {
  const normalizedPath = stripRootPrefix(params.path, params.rootPrefix)
  return {
    path: normalizePath(params.path),
    normalizedPath,
    size: params.size,
    extension: getExtension(normalizedPath),
    isText: typeof params.text === 'string',
    text: params.text,
    bytes: params.bytes,
  }
}
