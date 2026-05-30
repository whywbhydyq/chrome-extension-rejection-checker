import type { Finding, ScannerContext } from '../core/types'

const sourceUrl = 'https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getExtensionPageCsp(manifest: Record<string, unknown>): string[] {
  const csp = manifest.content_security_policy
  if (typeof csp === 'string') return [csp]
  if (isRecord(csp) && typeof csp.extension_pages === 'string') return [csp.extension_pages]
  return []
}

function getDirective(csp: string, directive: string): string[] {
  for (const part of csp.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean)
    if (tokens[0]?.toLowerCase() === directive.toLowerCase()) return tokens.slice(1)
  }
  return []
}

function hasRemoteSource(values: string[]): boolean {
  return values.some((value) => /^(?:https?:|wss?:)?\/\//i.test(value) || /^\*:/i.test(value))
}

function hasUnsafeEval(values: string[]): boolean {
  return values.some((value) => value.toLowerCase() === "'unsafe-eval'")
}

function hasWildcardSource(values: string[]): boolean {
  return values.some((value) => value === '*' || value === "'unsafe-inline'" || value === 'data:' || value === 'blob:')
}

function finding(title: string, snippet: string, reason: string, recommendation: string, manifestPath?: string): Finding {
  return {
    ruleId: 'CWS005',
    severity: 'high',
    title,
    file: manifestPath,
    snippet,
    reason,
    recommendation,
    sourceUrl,
  }
}

export function runCspRules(context: ScannerContext): Finding[] {
  if (!context.manifest) return []
  const findings: Finding[] = []

  for (const csp of getExtensionPageCsp(context.manifest)) {
    const scriptSrc = getDirective(csp, 'script-src')
    const objectSrc = getDirective(csp, 'object-src')
    const workerSrc = getDirective(csp, 'worker-src')

    if (hasUnsafeEval(scriptSrc) || hasUnsafeEval(workerSrc)) {
      findings.push(finding(
        "Extension CSP contains 'unsafe-eval'",
        csp,
        "The extension page CSP includes 'unsafe-eval'. This is not the same as wasm-unsafe-eval.",
        "Remove 'unsafe-eval'. Do not flag wasm-unsafe-eval by itself.",
        context.manifestPath,
      ))
    }

    if (hasRemoteSource(scriptSrc)) {
      findings.push(finding(
        'Extension CSP allows remote script sources',
        csp,
        'The extension page CSP script-src appears to allow remote origins.',
        "Restrict script-src to extension-local sources such as 'self' and remove remote script origins.",
        context.manifestPath,
      ))
    }

    if (workerSrc.length > 0 && hasRemoteSource(workerSrc)) {
      findings.push(finding(
        'Extension CSP allows remote worker sources',
        csp,
        'The extension page CSP worker-src appears to allow remote origins for worker scripts.',
        "Restrict worker-src to extension-local sources such as 'self' or omit the directive when script-src already constrains workers.",
        context.manifestPath,
      ))
    }

    if (objectSrc.length === 0) {
      findings.push(finding(
        'Extension CSP does not declare object-src',
        csp,
        'Manifest V3 extension pages should explicitly block object embeds unless the extension has a documented need.',
        "Add object-src 'none' to the extension_pages CSP unless you have a specific local object/embed requirement.",
        context.manifestPath,
      ))
    } else if (hasRemoteSource(objectSrc) || hasWildcardSource(objectSrc)) {
      findings.push(finding(
        'Extension CSP allows unsafe object sources',
        csp,
        'The extension page CSP object-src appears to allow remote, wildcard, inline, data, or blob sources.',
        "Set object-src to 'none' for typical Manifest V3 extensions.",
        context.manifestPath,
      ))
    }
  }

  return findings
}
