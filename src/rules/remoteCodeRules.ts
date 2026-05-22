import type { Finding, ScannerContext, VirtualFile } from '../core/types'
import { findMatches } from '../core/lineUtils'

const sourceUrl = 'https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code'
const remoteUrlPattern = /https?:\/\/[^\s'"`<>)]+/gi
const remoteCodeUrlPattern = /https?:\/\/[^\s'"`<>)]+\.(?:js|mjs|wasm)(?:[?#][^\s'"`<>)]+)?/i
const lowRemoteUrlExtensions = new Set(['.js', '.mjs', '.cjs', '.html', '.htm', '.css'])

function high(file: VirtualFile, line: number, snippet: string, title: string, reason: string): Finding {
  return {
    ruleId: 'CWS001',
    severity: 'high',
    title,
    file: file.normalizedPath,
    line,
    snippet,
    reason,
    recommendation: 'Bundle executable code inside the extension zip and reference local files instead of remote URLs.',
    sourceUrl,
  }
}

function scanHtml(file: VirtualFile): Finding[] {
  if (!file.text) return []
  const pattern = /<script\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi
  return findMatches(file.text, pattern).map((match) =>
    high(file, match.line, match.snippet, 'Remote script tag found', 'The extension page loads JavaScript from a remote URL.'),
  )
}

function scanJs(file: VirtualFile): Finding[] {
  if (!file.text) return []
  const findings: Finding[] = []
  const patterns: Array<{ pattern: RegExp; title: string; reason: string }> = [
    { pattern: /importScripts\s*\(\s*["']https?:\/\/[^"']+["']\s*\)/gi, title: 'Remote importScripts call found', reason: 'A worker imports code from a remote URL.' },
    { pattern: /\bimport\s+(?:[^'"()]+\s+from\s+)?["']https?:\/\/[^"']+\.(?:js|mjs)(?:[?#][^"']*)?["']/gi, title: 'Remote JavaScript import found', reason: 'The extension imports JavaScript from a remote URL.' },
    { pattern: /\bimport\s*\(\s*["']https?:\/\/[^"']+\.(?:js|mjs)(?:[?#][^"']*)?["']\s*\)/gi, title: 'Dynamic remote JavaScript import found', reason: 'The extension dynamically imports JavaScript from a remote URL.' },
    { pattern: /WebAssembly\.(?:instantiateStreaming|compileStreaming)\s*\(\s*fetch\s*\(\s*["']https?:\/\/[^"']+\.wasm(?:[?#][^"']*)?["']/gi, title: 'Remote WebAssembly execution path found', reason: 'The extension appears to fetch and execute WebAssembly from a remote URL.' },
  ]

  for (const item of patterns) {
    for (const match of findMatches(file.text, item.pattern)) findings.push(high(file, match.line, match.snippet, item.title, item.reason))
  }

  const dynamicExecutionPatterns: Array<{ pattern: RegExp; title: string; reason: string }> = [
    { pattern: /\beval\s*\(/gi, title: 'Dynamic string-code execution found', reason: 'String-code execution is strongly associated with extension CSP and review problems.' },
    { pattern: /\bnew\s+Function\s*\(/gi, title: 'Function constructor found', reason: 'The Function constructor creates code from strings.' },
    { pattern: /\bsetTimeout\s*\(\s*["'`]/gi, title: 'String-based timer found', reason: 'Passing a string to a timer executes that string as code.' },
    { pattern: /\bsetInterval\s*\(\s*["'`]/gi, title: 'String-based interval found', reason: 'Passing a string to an interval executes that string as code.' },
  ]

  for (const item of dynamicExecutionPatterns) {
    for (const match of findMatches(file.text, item.pattern)) {
      findings.push({ ruleId: 'CWS002', severity: 'high', title: item.title, file: file.normalizedPath, line: match.line, snippet: match.snippet, reason: item.reason, recommendation: 'Replace dynamic string execution with normal functions or bundled modules.', sourceUrl: 'https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy' })
    }
  }

  return findings
}

function shouldLowScan(file: VirtualFile): boolean {
  if (!lowRemoteUrlExtensions.has(file.extension)) return false
  if (file.normalizedPath === 'manifest.json') return false
  return true
}

function scanRemoteUrls(context: ScannerContext): Finding[] {
  const findings: Finding[] = []
  const seen = new Set<string>()
  for (const file of context.textFiles) {
    if (!file.text || !shouldLowScan(file)) continue
    for (const match of findMatches(file.text, remoteUrlPattern)) {
      const url = match.match[0]
      if (remoteCodeUrlPattern.test(url)) continue
      const key = `${file.normalizedPath}:${match.line}:${match.snippet}`
      if (seen.has(key)) continue
      seen.add(key)
      findings.push({ ruleId: 'CWS010', severity: 'low', title: 'Remote URL found for manual review', file: file.normalizedPath, line: match.line, snippet: match.snippet, reason: 'A remote URL was found in an executable or web resource file. It may be a normal API, image, JSON, CSS, or documentation URL.', recommendation: 'Confirm that this URL is not used to load or execute JavaScript or WebAssembly.', sourceUrl })
    }
  }
  return findings
}

export function runRemoteCodeRules(context: ScannerContext): Finding[] {
  return [...context.htmlFiles.flatMap(scanHtml), ...context.jsFiles.flatMap(scanJs), ...scanRemoteUrls(context)]
}
