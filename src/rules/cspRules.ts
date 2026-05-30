import type { Finding, ScannerContext, Severity } from '../core/types'

const sourceUrl = 'https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy'

type DirectiveReview = {
  directive: string
  token: string
  severity: Severity
  title: string
  reason: string
  recommendation: string
}

const allowedScriptTokens = new Set(["'self'", "'none'", "'wasm-unsafe-eval'"])
const allowedWorkerTokens = new Set(["'self'", "'none'", "'wasm-unsafe-eval'"])
const allowedObjectTokens = new Set(["'self'", "'none'"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isManifestV3(manifest: Record<string, unknown>): boolean {
  return manifest.manifest_version === 3
}

function hasSandboxPages(manifest: Record<string, unknown>): boolean {
  const sandbox = manifest.sandbox
  return isRecord(sandbox) && Array.isArray(sandbox.pages) && sandbox.pages.some((page) => typeof page === 'string' && page.trim().length > 0)
}

function getExtensionPageCsp(manifest: Record<string, unknown>): string[] {
  const csp = manifest.content_security_policy
  if (typeof csp === 'string') return [csp]
  if (isRecord(csp) && typeof csp.extension_pages === 'string') return [csp.extension_pages]
  return []
}

function getSandboxCsp(manifest: Record<string, unknown>): string | undefined {
  const csp = manifest.content_security_policy
  if (isRecord(csp) && typeof csp.sandbox === 'string' && csp.sandbox.trim()) return csp.sandbox
  return undefined
}

function parseDirectives(csp: string): Map<string, string[]> {
  const directives = new Map<string, string[]>()
  for (const part of csp.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean)
    const directive = tokens[0]?.toLowerCase()
    if (directive) directives.set(directive, tokens.slice(1))
  }
  return directives
}

function localhostSource(token: string): boolean {
  return /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(token)
}

function reviewToken(directive: string, token: string, allowedTokens: Set<string>): DirectiveReview | undefined {
  const normalized = token.toLowerCase()
  if (allowedTokens.has(normalized)) return undefined

  if (localhostSource(token)) {
    return {
      directive,
      token,
      severity: 'medium',
      title: 'Extension CSP contains a localhost development source',
      reason: `The ${directive} directive includes ${token}. Localhost CSP sources are only appropriate for unpacked development workflows, not final store submission packages.`,
      recommendation: 'Remove localhost sources from the production ZIP before Chrome Web Store submission.',
    }
  }

  const remoteOrBroadSource = /^(?:https?:|wss?:)?\/\//i.test(token) || /^(?:https?|wss?|ftp|data|blob|filesystem|chrome-extension):/i.test(token) || token === '*' || /^\*:/i.test(token)
  const unsafeKeyword = normalized === "'unsafe-eval'" || normalized === "'unsafe-inline'"
  const nonceOrHash = /^'(?:nonce-|sha256-|sha384-|sha512-)/i.test(token)

  if (remoteOrBroadSource || unsafeKeyword || nonceOrHash) {
    return {
      directive,
      token,
      severity: 'high',
      title: `Extension CSP allows unsafe ${directive} source`,
      reason: `The ${directive} directive includes ${token}, which is not an allowed Manifest V3 extension_pages source for production extension pages.`,
      recommendation: directive === 'object-src'
        ? "Use object-src 'self' only when packaged object/embed resources are required; otherwise use object-src 'none'."
        : "Restrict extension_pages CSP to packaged extension sources such as 'self' and the specific MV3 tokens Chrome allows.",
    }
  }

  return {
    directive,
    token,
    severity: 'high',
    title: `Extension CSP contains unsupported ${directive} token`,
    reason: `The ${directive} directive includes ${token}. This scanner only treats the documented Manifest V3 extension_pages allowlist as safe.`,
    recommendation: 'Remove unsupported CSP tokens from the production extension_pages policy or verify them against the current Chrome extension CSP documentation.',
  }
}

function finding(review: DirectiveReview, csp: string, manifestPath?: string): Finding {
  return {
    ruleId: 'CWS005',
    severity: review.severity,
    title: review.title,
    file: manifestPath,
    snippet: `${review.directive}: ${review.token}\n${csp}`,
    reason: review.reason,
    recommendation: review.recommendation,
    sourceUrl,
  }
}

function mixedNoneFinding(csp: string, directive: string, tokens: string[], manifestPath?: string): Finding | undefined {
  const hasNone = tokens.some((token) => token.toLowerCase() === "'none'")
  if (!hasNone || tokens.length <= 1) return undefined
  return {
    ruleId: 'CWS005',
    severity: 'medium',
    title: `Extension CSP mixes 'none' with other ${directive} sources`,
    file: manifestPath,
    snippet: `${directive}: ${tokens.join(' ')}\n${csp}`,
    reason: `The ${directive} directive includes 'none' alongside other source expressions. This is ambiguous and makes the production extension page CSP harder to review accurately.`,
    recommendation: `Use either ${directive} 'none' by itself or remove 'none' and list only the packaged sources the extension page actually needs.`,
    sourceUrl,
  }
}

function stringCspFormatFinding(csp: string, manifestPath?: string): Finding {
  return {
    ruleId: 'CWS005',
    severity: 'high',
    title: 'Manifest V3 content_security_policy uses the legacy string format',
    file: manifestPath,
    snippet: csp,
    reason: 'Manifest V3 expects content_security_policy to be an object with an extension_pages policy. A legacy string policy can make the final package invalid even if the tokens themselves look safe.',
    recommendation: "Change content_security_policy to { \"extension_pages\": \"script-src 'self'; object-src 'self'\" } or the stricter object-src policy your extension actually needs.",
    sourceUrl,
  }
}

function sandboxManualReviewFinding(manifest: Record<string, unknown>, manifestPath?: string): Finding {
  const sandboxCsp = getSandboxCsp(manifest)
  return {
    ruleId: 'CWS005',
    severity: 'medium',
    title: 'Sandbox pages need separate CSP review',
    file: manifestPath,
    snippet: sandboxCsp ? `content_security_policy.sandbox: ${sandboxCsp}` : 'sandbox.pages is present, but content_security_policy.sandbox was not found.',
    reason: 'Sandbox pages use a separate CSP model from extension_pages. This scanner does not treat sandbox CSP as proof that extension page CSP is safe, and it does not fully evaluate sandbox runtime behavior.',
    recommendation: 'Verify every sandbox page is packaged locally, review its separate sandbox CSP, and make sure sandboxed code does not become a path for remote executable code or user-data leakage.',
    sourceUrl,
  }
}

function sandboxCspFindings(manifest: Record<string, unknown>, manifestPath?: string): Finding[] {
  if (!hasSandboxPages(manifest)) return []
  const sandboxCsp = getSandboxCsp(manifest)
  if (!sandboxCsp) return []
  const directives = parseDirectives(sandboxCsp)
  const sandboxTokens = directives.get('sandbox')
  const findings: Finding[] = []

  if (!sandboxTokens) {
    findings.push({
      ruleId: 'CWS005',
      severity: 'high',
      title: 'Sandbox CSP does not include a sandbox directive',
      file: manifestPath,
      snippet: `content_security_policy.sandbox: ${sandboxCsp}`,
      reason: 'Sandbox pages need their own sandbox CSP boundary. Without an explicit sandbox directive, the separate sandbox policy is incomplete for Chrome extension review.',
      recommendation: 'Add an explicit sandbox directive to content_security_policy.sandbox and keep it separate from extension_pages CSP.',
      sourceUrl,
    })
    return findings
  }

  if (sandboxTokens.some((token) => token.toLowerCase() === 'allow-same-origin')) {
    findings.push({
      ruleId: 'CWS005',
      severity: 'high',
      title: 'Sandbox CSP grants allow-same-origin',
      file: manifestPath,
      snippet: `sandbox: ${sandboxTokens.join(' ')}\n${sandboxCsp}`,
      reason: 'Sandbox pages should not use allow-same-origin because it weakens the isolation boundary that separates sandboxed pages from extension pages.',
      recommendation: 'Remove allow-same-origin from content_security_policy.sandbox and review whether the sandbox page still needs to exist in the submitted package.',
      sourceUrl,
    })
  }

  return findings
}

function missingObjectSrcFinding(csp: string, manifestPath?: string): Finding {
  return {
    ruleId: 'CWS005',
    severity: 'medium',
    title: 'Extension CSP does not declare object-src',
    file: manifestPath,
    snippet: csp,
    reason: 'Manifest V3 extension page CSP should make the object/embed policy explicit so review and maintenance do not depend on fallback behavior.',
    recommendation: "Add object-src 'self' if packaged object/embed resources are required; otherwise add object-src 'none'.",
    sourceUrl,
  }
}

function reviewDirective(csp: string, manifestPath: string | undefined, directive: string, tokens: string[], allowedTokens: Set<string>): Finding[] {
  return tokens
    .map((token) => reviewToken(directive, token, allowedTokens))
    .filter((review): review is DirectiveReview => Boolean(review))
    .map((review) => finding(review, csp, manifestPath))
}

export function runCspRules(context: ScannerContext): Finding[] {
  if (!context.manifest) return []
  const findings: Finding[] = []
  const cspValue = context.manifest.content_security_policy

  if (isManifestV3(context.manifest) && typeof cspValue === 'string') {
    findings.push(stringCspFormatFinding(cspValue, context.manifestPath))
  }

  if (hasSandboxPages(context.manifest)) {
    findings.push(sandboxManualReviewFinding(context.manifest, context.manifestPath))
    findings.push(...sandboxCspFindings(context.manifest, context.manifestPath))
  }

  for (const csp of getExtensionPageCsp(context.manifest)) {
    const directives = parseDirectives(csp)
    const defaultSrc = directives.get('default-src') ?? []
    const scriptSrc = directives.get('script-src') ?? []
    const workerSrc = directives.get('worker-src') ?? []
    const objectSrc = directives.get('object-src') ?? []

    const scriptTokens = scriptSrc.length > 0 ? scriptSrc : defaultSrc
    const scriptDirectiveName = scriptSrc.length > 0 ? 'script-src' : 'default-src fallback for script-src'
    const scriptNoneFinding = mixedNoneFinding(csp, scriptDirectiveName, scriptTokens, context.manifestPath)
    if (scriptNoneFinding) findings.push(scriptNoneFinding)
    if (scriptTokens.length > 0) findings.push(...reviewDirective(csp, context.manifestPath, scriptDirectiveName, scriptTokens, allowedScriptTokens))

    const workerTokens = workerSrc.length > 0 ? workerSrc : scriptSrc.length > 0 ? scriptSrc : defaultSrc
    const workerDirectiveName = workerSrc.length > 0 ? 'worker-src' : scriptSrc.length > 0 ? 'script-src fallback for worker-src' : 'default-src fallback for worker-src'
    const workerNoneFinding = mixedNoneFinding(csp, workerDirectiveName, workerTokens, context.manifestPath)
    if (workerNoneFinding) findings.push(workerNoneFinding)
    if (workerTokens.length > 0) findings.push(...reviewDirective(csp, context.manifestPath, workerDirectiveName, workerTokens, allowedWorkerTokens))

    if (objectSrc.length === 0) {
      findings.push(missingObjectSrcFinding(csp, context.manifestPath))
    } else {
      const objectNoneFinding = mixedNoneFinding(csp, 'object-src', objectSrc, context.manifestPath)
      if (objectNoneFinding) findings.push(objectNoneFinding)
      findings.push(...reviewDirective(csp, context.manifestPath, 'object-src', objectSrc, allowedObjectTokens))
    }
  }

  return findings
}
