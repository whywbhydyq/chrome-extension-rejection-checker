import type { Finding, ScannerContext, VirtualFile } from '../core/types'
import { findMatches } from '../core/lineUtils'

const sourceUrl = 'https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code'
const remoteUrlPattern = /(?:https?:)?\/\/[^\s'"`<>)]+/gi
const remoteCodeUrlPattern = /(?:https?:)?\/\/[^\s'"`<>)]+\.(?:js|mjs|cjs|wasm)(?:[?#][^\s'"`<>)]+)?/i
const directRemoteLiteralPattern = /(?:["'`](?:https?:)?\/\/[^"'`]+["'`])/i
const lowRemoteUrlExtensions = new Set(['.js', '.mjs', '.cjs', '.html', '.htm', '.css'])

function confidenceForFile(file: VirtualFile, highConfidence: string): string {
  if (/(^|\/)(?:test|tests|__tests__|fixtures?|docs?)\//i.test(file.normalizedPath) || /(?:\.test|\.spec|\.fixture)\.[cm]?js$/i.test(file.normalizedPath) || file.normalizedPath.endsWith('.map')) {
    return `possible non-runtime context; verify whether ${file.normalizedPath} is included in the production extension package`
  }
  return highConfidence
}

const highConfidenceRemoteCodeContextPattern = /(<script\b|importScripts\s*\(|\bimport\s*(?:\(|[^;]*\bfrom\b)|\bnew\s+(?:Shared)?Worker\s*\(|\bserviceWorker\.register\s*\(|\b(?:audioWorklet|paintWorklet|layoutWorklet|animationWorklet)\.addModule\s*\(|WebAssembly\.(?:instantiate|compile|instantiateStreaming|compileStreaming)|(?:\b(?:script|module|worker|wasm|loader|code)[\w$]*\.(?:src|href|data)|setAttribute\s*\(\s*["'](?:src|href|data)["'])|\bfetch\s*\()/i

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

function hasRemoteLiteral(value: string): boolean {
  return /(?:https?:)?\/\//i.test(value)
}

function identifierPattern(identifier: string): RegExp {
  return new RegExp(`(^|[^\\w$])${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\w$]|$)`)
}

function expressionContainsIdentifier(expression: string, identifiers: Set<string>): boolean {
  for (const identifier of identifiers) {
    if (identifierPattern(identifier).test(expression)) return true
  }
  return false
}

function expressionContainsRemoteSignal(expression: string, remoteIdentifiers: Set<string>): boolean {
  return hasRemoteLiteral(expression) || expressionContainsIdentifier(expression, remoteIdentifiers)
}

function collectRemoteUrlIdentifiers(text: string): Set<string> {
  const identifiers = new Set<string>()
  const declarations = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(["'`])(?:https?:)?\/\/[\s\S]*?\2/g
  let match: RegExpExecArray | null

  while ((match = declarations.exec(text)) !== null) {
    identifiers.add(match[1])
  }

  const assignments = /\b([A-Za-z_$][\w$]*)\s*=\s*(["'`])(?:https?:)?\/\/[\s\S]*?\2/g
  while ((match = assignments.exec(text)) !== null) {
    identifiers.add(match[1])
  }

  return identifiers
}

function collectRemoteFetchPayloadIdentifiers(text: string, remoteIdentifiers: Set<string>): Set<string> {
  const identifiers = new Set<string>()
  const declarations = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?fetch\s*\(([\s\S]{0,220}?)\)(?:\s*\.\s*then\s*\([\s\S]{0,220}?\)){0,4}/g
  let match: RegExpExecArray | null

  while ((match = declarations.exec(text)) !== null) {
    if (expressionContainsRemoteSignal(match[2], remoteIdentifiers)) identifiers.add(match[1])
  }

  return identifiers
}

function pushUnique(findingList: Finding[], seen: Set<string>, finding: Finding): void {
  const key = `${finding.ruleId}:${finding.file}:${finding.line}:${finding.title}:${finding.snippet}`
  if (seen.has(key)) return
  seen.add(key)
  findingList.push(finding)
}

function scanHtml(file: VirtualFile): Finding[] {
  if (!file.text) return []
  const findings: Finding[] = []
  const patterns: Array<{ pattern: RegExp; title: string; reason: string }> = [
    {
      pattern: /<script\b[^>]*\bsrc\s*=\s*(?:["'])?(?:https?:)?\/\/[^\s"'>]+(?:["'])?[^>]*>/gi,
      title: 'Remote script tag found',
      reason: 'The extension page loads JavaScript from a remote URL. Chrome Web Store treats JavaScript loaded from outside the extension package as remotely hosted code even when the URL has no .js extension.',
    },
  ]

  for (const item of patterns) {
    for (const match of findMatches(file.text, item.pattern)) {
      findings.push(high(file, match.line, match.snippet, item.title, item.reason))
    }
  }

  return findings
}

type LoaderPattern = {
  pattern: RegExp
  argumentGroup: number
  title: string
  reason: string
}

function scanRemoteExecutableLoaders(file: VirtualFile, remoteIdentifiers: Set<string>, seen: Set<string>): Finding[] {
  if (!file.text) return []
  const findings: Finding[] = []
  const loaderPatterns: LoaderPattern[] = [
    {
      pattern: /importScripts\s*\(([\s\S]{0,500}?)\)/gi,
      argumentGroup: 1,
      title: 'Remote importScripts call found',
      reason: 'A worker imports executable code from a remote URL. The URL does not need a .js extension to be review-relevant when it is passed to importScripts().',
    },
    {
      pattern: /\bimport\s*\(([\s\S]{0,500}?)\)/gi,
      argumentGroup: 1,
      title: 'Dynamic remote module import found',
      reason: 'The extension dynamically imports a module from a remote URL. Extensionless module URLs and templated CDN URLs can still be remotely hosted code.',
    },
    {
      pattern: /\bnew\s+(?:Shared)?Worker\s*\(([\s\S]{0,500}?)\)/gi,
      argumentGroup: 1,
      title: 'Remote Worker script found',
      reason: 'The extension creates a Worker or SharedWorker from a remote URL. Worker script URLs are executable loading contexts even without a file extension.',
    },
    {
      pattern: /\bserviceWorker\.register\s*\(([\s\S]{0,500}?)\)/gi,
      argumentGroup: 1,
      title: 'Remote service worker registration found',
      reason: 'The code registers a service worker script from a remote URL. Service worker registration is an executable loading context.',
    },
    {
      pattern: /\b(?:audioWorklet|paintWorklet|layoutWorklet|animationWorklet)\.addModule\s*\(([\s\S]{0,500}?)\)/gi,
      argumentGroup: 1,
      title: 'Remote worklet module found',
      reason: 'The code loads a worklet module from a remote URL. Worklet modules are executable loading contexts.',
    },
    {
      pattern: /WebAssembly\.(?:instantiateStreaming|compileStreaming)\s*\(\s*fetch\s*\(([\s\S]{0,500}?)\)/gi,
      argumentGroup: 1,
      title: 'Remote WebAssembly streaming execution path found',
      reason: 'The extension appears to fetch and execute WebAssembly from a remote URL.',
    },
  ]

  for (const item of loaderPatterns) {
    for (const match of findMatches(file.text, item.pattern)) {
      const argument = match.match[item.argumentGroup] ?? match.snippet
      if (!expressionContainsRemoteSignal(argument, remoteIdentifiers)) continue
      pushUnique(findings, seen, high(file, match.line, match.snippet, item.title, item.reason))
    }
  }

  const staticImportPattern = /\bimport\s+(?:[^'"();]+?\s+from\s+)?(["'`][\s\S]{0,300}?["'`])/gi
  for (const match of findMatches(file.text, staticImportPattern)) {
    const specifier = match.match[1] ?? match.snippet
    if (!hasRemoteLiteral(specifier)) continue
    pushUnique(
      findings,
      seen,
      high(
        file,
        match.line,
        match.snippet,
        'Remote static import found',
        'The extension imports a module from a remote URL. Chrome Web Store review evaluates the compiled package, and remote module specifiers are remotely hosted code even when extensionless.',
      ),
    )
  }

  const remoteLoaderAssignmentPatterns: Array<{ pattern: RegExp; title: string; reason: string }> = [
    {
      pattern: /\b(?:script|module|worker|sharedWorker|serviceWorker|worklet|wasm|loader|code)[\w$]*\.(?:src|href|data)\s*=\s*([^;\n]+)/gi,
      title: 'Remote executable loader assignment found',
      reason: 'The code assigns a remote URL or remote URL variable to an executable-looking loader property.',
    },
    {
      pattern: /\b(?:script|module|worker|sharedWorker|serviceWorker|worklet|wasm|loader|code)[\w$]*\.setAttribute\s*\(\s*["'](?:src|href|data)["']\s*,\s*([\s\S]{0,360}?)\)/gi,
      title: 'Remote executable setAttribute found',
      reason: 'The code sets a remote URL or remote URL variable on an executable-looking element attribute.',
    },
  ]

  for (const item of remoteLoaderAssignmentPatterns) {
    for (const match of findMatches(file.text, item.pattern)) {
      const expression = match.match[1] ?? match.snippet
      if (!expressionContainsRemoteSignal(expression, remoteIdentifiers)) continue
      pushUnique(findings, seen, high(file, match.line, match.snippet, item.title, item.reason))
    }
  }

  return findings
}

function scanRemoteFetchExecution(file: VirtualFile, remoteIdentifiers: Set<string>, seen: Set<string>): Finding[] {
  if (!file.text) return []
  const findings: Finding[] = []
  const payloadIdentifiers = collectRemoteFetchPayloadIdentifiers(file.text, remoteIdentifiers)

  const directFetchToSinkPatterns: Array<{ pattern: RegExp; argumentGroup: number; title: string; reason: string }> = [
    {
      pattern: /fetch\s*\(([\s\S]{0,220}?)\)(?:\s*\.\s*then\s*\([\s\S]{0,220}?\)){0,5}\s*\.\s*then\s*\(\s*(?:eval|Function|WebAssembly\.(?:instantiate|compile))/gi,
      argumentGroup: 1,
      title: 'Remote fetch-to-execution chain found',
      reason: 'The code fetches a remote resource and chains the result toward eval, Function, or WebAssembly execution. Remote code fetched for execution is remotely hosted code.',
    },
    {
      pattern: /\b(?:eval|new\s+Function|WebAssembly\.(?:instantiate|compile))\s*\(\s*(?:await\s+)?fetch\s*\(([\s\S]{0,220}?)\)/gi,
      argumentGroup: 1,
      title: 'Remote fetch executed directly',
      reason: 'The code appears to execute data fetched directly from a remote URL.',
    },
  ]

  for (const item of directFetchToSinkPatterns) {
    for (const match of findMatches(file.text, item.pattern)) {
      const argument = match.match[item.argumentGroup] ?? match.snippet
      if (!expressionContainsRemoteSignal(argument, remoteIdentifiers)) continue
      pushUnique(findings, seen, high(file, match.line, match.snippet, item.title, item.reason))
    }
  }

  if (payloadIdentifiers.size > 0) {
    const payloadUsePattern = /\b(?:eval|new\s+Function|WebAssembly\.(?:instantiate|compile))\s*\(([\s\S]{0,220}?)\)/gi
    for (const match of findMatches(file.text, payloadUsePattern)) {
      const argument = match.match[1] ?? match.snippet
      if (!expressionContainsIdentifier(argument, payloadIdentifiers)) continue
      pushUnique(
        findings,
        seen,
        high(
          file,
          match.line,
          match.snippet,
          'Remote fetched payload executed',
          'A value populated from fetch(remote URL) is later passed to eval, Function, or WebAssembly execution.',
        ),
      )
    }
  }

  return findings
}

function scanJs(file: VirtualFile): Finding[] {
  if (!file.text) return []
  const findings: Finding[] = []
  const seen = new Set<string>()
  const remoteIdentifiers = collectRemoteUrlIdentifiers(file.text)

  for (const finding of scanRemoteExecutableLoaders(file, remoteIdentifiers, seen)) findings.push(finding)
  for (const finding of scanRemoteFetchExecution(file, remoteIdentifiers, seen)) findings.push(finding)

  const executableRemotePatterns: Array<{ pattern: RegExp; title: string; reason: string }> = [
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
    for (const match of findMatches(file.text, item.pattern)) {
      pushUnique(findings, seen, high(file, match.line, match.snippet, item.title, item.reason))
    }
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
    for (const match of findMatches(file.text, item.pattern)) {
      findings.push(dynamicCode(file, match.line, match.snippet, item.title, item.reason))
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
      const looksExecutable = remoteCodeUrlPattern.test(url)
      const directLiteral = directRemoteLiteralPattern.test(match.snippet)
      if ((looksExecutable || directLiteral) && highConfidenceRemoteCodeContextPattern.test(match.snippet)) continue
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
