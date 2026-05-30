import type { Finding, ScannerContext, VirtualFile } from '../core/types'
import { findMatches } from '../core/lineUtils'

const sourceUrl = 'https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code'
const remoteUrlPattern = /(?:https?:)?\/\/[^\s'"`<>)]+/gi
const remoteCodeUrlPattern = /(?:https?:)?\/\/[^\s'"`<>)]+\.(?:js|mjs|cjs|wasm)(?:[?#][^\s'"`<>)]+)?/i
const lowRemoteUrlExtensions = new Set(['.js', '.mjs', '.cjs', '.html', '.htm', '.css'])

function confidenceForFile(file: VirtualFile, highConfidence: string): string {
  if (/(^|\/)(?:test|tests|__tests__|fixtures?|docs?)\//i.test(file.normalizedPath) || /(?:\.test|\.spec|\.fixture)\.[cm]?js$/i.test(file.normalizedPath) || file.normalizedPath.endsWith('.map')) {
    return `possible non-runtime context; verify whether ${file.normalizedPath} is included in the production extension package`
  }
  return highConfidence
}

const highConfidenceRemoteCodeContextPattern = /(<script\b|importScripts\s*\(|\bimport\s*(?:\(|[^;]*\bfrom\b)|\bnew\s+(?:Shared)?Worker\s*\(|\bserviceWorker\.register\s*\(|\b(?:audioWorklet|paintWorklet|layoutWorklet|animationWorklet)\.addModule\s*\(|WebAssembly\.(?:instantiateStreaming|compileStreaming)|(?:\bsrc|\.src|\bhref|\.href|\bdata|\.data)\s*=|setAttribute\s*\()/i

function high(file: VirtualFile, line: number, snippet: string, title: string, reason: string): Finding {
  return {
    ruleId: 'CWS001',
    severity: 'high',
    title,
    file: file.normalizedPath,
    line,
    snippet,
    reason,
    recommendation: 'Bundle executable code inside the extension ZIP and reference local files instead of remote URLs.',
    sourceUrl,
    confidence: confidenceForFile(file, 'high-confidence executable loading pattern'),
  }
}

function dynamicCode(file: VirtualFile, line: number, snippet: string, title: string, reason: string): Finding {
  return {
    ruleId: 'CWS002',
    severity: 'high',
    title,
    file: file.normalizedPath,
    line,
    snippet,
    reason,
    recommendation: 'Replace dynamic string execution with normal functions, static imports, bundled modules, or a narrow local command map.',
    sourceUrl: 'https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy',
    confidence: confidenceForFile(file, 'high-confidence dynamic code pattern'),
  }
}

function scanHtml(file: VirtualFile): Finding[] {
  if (!file.text) return []
  const findings: Finding[] = []
  const patterns: Array<{ pattern: RegExp; title: string; reason: string }> = [
    {
      pattern: /<script\b[^>]*\bsrc\s*=\s*(?:["'])?(?:https?:)?\/\/[^\s"'>]+(?:["'])?[^>]*>/gi,
      title: 'Remote script tag found',
      reason: 'The extension page loads JavaScript from a remote URL.',
    },
  ]

  for (const item of patterns) {
    for (const match of findMatches(file.text, item.pattern)) {
      findings.push(high(file, match.line, match.snippet, item.title, item.reason))
    }
  }

  return findings
}

function scanJs(file: VirtualFile): Finding[] {
  if (!file.text) return []
  const findings: Finding[] = []
  const executableRemotePatterns: Array<{ pattern: RegExp; title: string; reason: string }> = [
    {
      pattern: /importScripts\s*\([^)]*(?:https?:)?\/\/[^)]*\.(?:js|mjs|cjs)(?:[?#][^'"`)]*)?[^)]*\)/gi,
      title: 'Remote importScripts call found',
      reason: 'A worker imports executable code from a remote URL.',
    },
    {
      pattern: /\bimport\s+(?:[^'"()]+\s+from\s+)?["'](?:https?:)?\/\/[^"']+\.(?:js|mjs|cjs)(?:[?#][^"']*)?["']/gi,
      title: 'Remote JavaScript import found',
      reason: 'The extension imports JavaScript from a remote URL.',
    },
    {
      pattern: /\bimport\s*\(\s*["'](?:https?:)?\/\/[^"']+\.(?:js|mjs|cjs)(?:[?#][^"']*)?["']\s*\)/gi,
      title: 'Dynamic remote JavaScript import found',
      reason: 'The extension dynamically imports JavaScript from a remote URL.',
    },
    {
      pattern: /\bnew\s+(?:Shared)?Worker\s*\(\s*["'](?:https?:)?\/\/[^"']+\.(?:js|mjs|cjs)(?:[?#][^"']*)?["']/gi,
      title: 'Remote Worker script found',
      reason: 'The extension creates a Worker or SharedWorker from a remote JavaScript URL.',
    },
    {
      pattern: /\bserviceWorker\.register\s*\(\s*["'](?:https?:)?\/\/[^"']+\.(?:js|mjs|cjs)(?:[?#][^"']*)?["']/gi,
      title: 'Remote service worker registration found',
      reason: 'The code registers a service worker script from a remote JavaScript URL.',
    },
    {
      pattern: /\b(?:audioWorklet|paintWorklet|layoutWorklet|animationWorklet)\.addModule\s*\(\s*["'](?:https?:)?\/\/[^"']+\.(?:js|mjs|cjs)(?:[?#][^"']*)?["']/gi,
      title: 'Remote worklet module found',
      reason: 'The code loads a worklet module from a remote JavaScript URL.',
    },
    {
      pattern: /WebAssembly\.(?:instantiateStreaming|compileStreaming)\s*\(\s*fetch\s*\(\s*["'](?:https?:)?\/\/[^"']+\.wasm(?:[?#][^"']*)?["']/gi,
      title: 'Remote WebAssembly execution path found',
      reason: 'The extension appears to fetch and execute WebAssembly from a remote URL.',
    },
    {
      pattern: /(?:\bsrc|\.src|\bhref|\.href|\bdata|\.data)\s*=\s*["'](?:https?:)?\/\/[^"']+\.(?:js|mjs|cjs|wasm)(?:[?#][^"']*)?["']/gi,
      title: 'Remote executable URL assignment found',
      reason: 'The code assigns a remote executable URL to a property that may load code.',
    },
    {
      pattern: /setAttribute\s*\(\s*["'](?:src|href|data)["']\s*,\s*["'](?:https?:)?\/\/[^"']+\.(?:js|mjs|cjs|wasm)(?:[?#][^"']*)?["']\s*\)/gi,
      title: 'Remote executable setAttribute found',
      reason: 'The code sets a remote executable URL on an element attribute.',
    },
  ]

  for (const item of executableRemotePatterns) {
    for (const match of findMatches(file.text, item.pattern)) findings.push(high(file, match.line, match.snippet, item.title, item.reason))
  }

  const dynamicExecutionPatterns: Array<{ pattern: RegExp; title: string; reason: string }> = [
    { pattern: /\beval\s*\(/gi, title: 'Dynamic string-code execution found', reason: 'String-code execution is strongly associated with extension CSP and review problems.' },
    { pattern: /\bnew\s+Function\s*\(/gi, title: 'Function constructor found', reason: 'The Function constructor creates code from strings.' },
    { pattern: /\bsetTimeout\s*\(\s*["'`]/gi, title: 'String-based timer found', reason: 'Passing a string to a timer executes that string as code.' },
    { pattern: /\bsetInterval\s*\(\s*["'`]/gi, title: 'String-based interval found', reason: 'Passing a string to an interval executes that string as code.' },
    { pattern: /\bsetImmediate\s*\(\s*["'`]/gi, title: 'String-based immediate callback found', reason: 'Passing a string to a timer-like callback can execute that string as code in legacy or polyfilled runtimes.' },
    { pattern: /\b(?:chrome|browser)\.tabs\.executeScript\s*\([^)]*\bcode\s*:/gis, title: 'Legacy tabs.executeScript code injection found', reason: 'Legacy extension code injection with a code string is associated with MV2 migration and remote-review problems.' },
    { pattern: /\bchrome\.devtools\.inspectedWindow\.eval\s*\(/gi, title: 'DevTools inspectedWindow.eval found', reason: 'DevTools inspectedWindow.eval evaluates strings and should be manually reviewed for remote or user-controlled code paths.' },
  ]

  for (const item of dynamicExecutionPatterns) {
    for (const match of findMatches(file.text, item.pattern)) findings.push(dynamicCode(file, match.line, match.snippet, item.title, item.reason))
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
      const looksExecutable = remoteCodeUrlPattern.test(url)
      if (looksExecutable && highConfidenceRemoteCodeContextPattern.test(match.snippet)) continue
      const key = `${file.normalizedPath}:${match.line}:${url}:${looksExecutable ? 'executable' : 'remote'}`
      if (seen.has(key)) continue
      seen.add(key)
      findings.push({
        ruleId: 'CWS010',
        severity: looksExecutable ? 'medium' : 'low',
        title: looksExecutable ? 'Remote executable URL string found for manual review' : 'Remote URL found for manual review',
        file: file.normalizedPath,
        line: match.line,
        snippet: match.snippet,
        reason: looksExecutable
          ? 'A remote JavaScript or WebAssembly URL was found outside a high-confidence loading pattern. It may be a harmless string, but it can also be used later to assemble or load remote executable code.'
          : 'A remote URL was found in an executable or web resource file. It may be a normal API, image, JSON, CSS, documentation URL, or a dynamically assembled executable URL.',
        recommendation: looksExecutable
          ? 'Confirm that this URL is not later assigned to a loader, passed into a Worker/import path, fetched and evaluated, or interpreted as executable code. Bundle executable code locally inside the ZIP.'
          : 'Confirm that this URL is not used to load, assemble, interpret, or execute JavaScript or WebAssembly.',
        sourceUrl,
        confidence: looksExecutable ? confidenceForFile(file, 'manual-review executable URL string') : confidenceForFile(file, 'manual-review remote URL string'),
      })
    }
  }
  return findings
}

export function runRemoteCodeRules(context: ScannerContext): Finding[] {
  return [...context.htmlFiles.flatMap(scanHtml), ...context.jsFiles.flatMap(scanJs), ...scanRemoteUrls(context)]
}
