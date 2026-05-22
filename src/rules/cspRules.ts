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

function scriptSrcContainsRemoteSource(csp: string): boolean {
  const scriptSrc = csp.match(/script-src\s+([^;]+)/i)?.[1]
  return Boolean(scriptSrc && /https?:\/\//i.test(scriptSrc))
}

function containsUnsafeEval(csp: string): boolean {
  return /(^|\s)'unsafe-eval'(?=\s|;|$)/i.test(csp)
}

export function runCspRules(context: ScannerContext): Finding[] {
  if (!context.manifest) return []
  const findings: Finding[] = []

  for (const csp of getExtensionPageCsp(context.manifest)) {
    if (containsUnsafeEval(csp)) {
      findings.push({
        ruleId: 'CWS005',
        severity: 'high',
        title: "Extension CSP contains 'unsafe-eval'",
        file: context.manifestPath,
        snippet: csp,
        reason: "The extension page CSP includes 'unsafe-eval'. This is not the same as wasm-unsafe-eval.",
        recommendation: "Remove 'unsafe-eval'. Do not flag wasm-unsafe-eval by itself.",
        sourceUrl,
      })
    }

    if (scriptSrcContainsRemoteSource(csp)) {
      findings.push({
        ruleId: 'CWS005',
        severity: 'high',
        title: 'Extension CSP allows remote script sources',
        file: context.manifestPath,
        snippet: csp,
        reason: 'The extension page CSP script-src appears to allow remote origins.',
        recommendation: "Restrict script-src to extension-local sources such as 'self' and remove remote script origins.",
        sourceUrl,
      })
    }
  }

  return findings
}
