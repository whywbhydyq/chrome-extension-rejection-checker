import type { Finding, ScannerContext, Severity } from '../core/types'

const manifestSource = 'https://developer.chrome.com/docs/extensions/reference/manifest'
const prepareSource = 'https://developer.chrome.com/docs/webstore/publish/preparing'
const remoteHostedCodeSource = 'https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code'

type ManifestRef = {
  path: string
  label: string
  executable: boolean
  wildcardAllowed?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
}

function addStringRef(refs: ManifestRef[], value: unknown, label: string, executable = false, wildcardAllowed = false) {
  const path = stringValue(value)
  if (path) refs.push({ path, label, executable, wildcardAllowed })
}

function addRecordStringRefs(refs: ManifestRef[], value: unknown, labelPrefix: string) {
  if (!isRecord(value)) return
  for (const [key, path] of Object.entries(value)) {
    const refPath = stringValue(path)
    if (refPath) refs.push({ path: refPath, label: `${labelPrefix}.${key}`, executable: false })
  }
}

function isRemoteLikePath(path: string): boolean {
  return /^(?:https?:)?\/\//i.test(path)
}

function isCheckableLocalPath(path: string): boolean {
  if (isRemoteLikePath(path)) return false
  if (path.includes('*')) return false
  if (path.startsWith('/')) return false
  return true
}

function collectReferences(manifest: Record<string, unknown>): ManifestRef[] {
  const refs: ManifestRef[] = []

  const background = isRecord(manifest.background) ? manifest.background : undefined
  addStringRef(refs, background?.service_worker, 'background.service_worker', true)

  const action = isRecord(manifest.action) ? manifest.action : undefined
  addStringRef(refs, action?.default_popup, 'action.default_popup', true)
  addRecordStringRefs(refs, action?.default_icon, 'action.default_icon')

  addStringRef(refs, manifest.options_page, 'options_page', true)
  const optionsUi = isRecord(manifest.options_ui) ? manifest.options_ui : undefined
  addStringRef(refs, optionsUi?.page, 'options_ui.page', true)
  addStringRef(refs, manifest.devtools_page, 'devtools_page', true)

  const sidePanel = isRecord(manifest.side_panel) ? manifest.side_panel : undefined
  addStringRef(refs, sidePanel?.default_path, 'side_panel.default_path', true)

  addRecordStringRefs(refs, manifest.icons, 'icons')

  const chromeUrlOverrides = isRecord(manifest.chrome_url_overrides) ? manifest.chrome_url_overrides : undefined
  addStringRef(refs, chromeUrlOverrides?.newtab, 'chrome_url_overrides.newtab', true)
  addStringRef(refs, chromeUrlOverrides?.bookmarks, 'chrome_url_overrides.bookmarks', true)
  addStringRef(refs, chromeUrlOverrides?.history, 'chrome_url_overrides.history', true)

  const contentScripts = Array.isArray(manifest.content_scripts) ? manifest.content_scripts : []
  contentScripts.forEach((item, index) => {
    if (!isRecord(item)) return
    stringArray(item.js).forEach((path, pathIndex) => refs.push({ path, label: `content_scripts[${index}].js[${pathIndex}]`, executable: true }))
    stringArray(item.css).forEach((path, pathIndex) => refs.push({ path, label: `content_scripts[${index}].css[${pathIndex}]`, executable: false }))
  })

  const webAccessibleResources = Array.isArray(manifest.web_accessible_resources) ? manifest.web_accessible_resources : []
  webAccessibleResources.forEach((item, index) => {
    if (!isRecord(item)) return
    stringArray(item.resources).forEach((path, pathIndex) => refs.push({ path, label: `web_accessible_resources[${index}].resources[${pathIndex}]`, executable: false, wildcardAllowed: true }))
  })

  const sandbox = isRecord(manifest.sandbox) ? manifest.sandbox : undefined
  stringArray(sandbox?.pages).forEach((path, pathIndex) => refs.push({ path, label: `sandbox.pages[${pathIndex}]`, executable: true }))

  const declarativeNetRequest = isRecord(manifest.declarative_net_request) ? manifest.declarative_net_request : undefined
  const ruleResources = Array.isArray(declarativeNetRequest?.rule_resources) ? declarativeNetRequest.rule_resources : []
  ruleResources.forEach((item, index) => {
    if (!isRecord(item)) return
    addStringRef(refs, item.path, `declarative_net_request.rule_resources[${index}].path`)
  })

  return refs
}

function manifestFinding(params: {
  ruleId: string
  severity: Severity
  title: string
  manifestPath?: string
  snippet?: string
  reason: string
  recommendation: string
  sourceUrl?: string
}): Finding {
  return {
    ruleId: params.ruleId,
    severity: params.severity,
    title: params.title,
    file: params.manifestPath,
    snippet: params.snippet,
    reason: params.reason,
    recommendation: params.recommendation,
    sourceUrl: params.sourceUrl ?? manifestSource,
  }
}

function reviewManifestReference(ref: ManifestRef, context: ScannerContext): Finding | undefined {
  const snippet = `${ref.label}: ${ref.path}`

  if (isRemoteLikePath(ref.path)) {
    if (ref.executable) {
      return manifestFinding({
        ruleId: 'CWS001',
        severity: 'high',
        title: 'Manifest references remote executable code',
        manifestPath: context.manifestPath,
        snippet,
        reason: `The manifest field ${ref.label} points to a remote URL. Executable extension code must be packaged inside the submitted ZIP, not loaded from a remote host.`,
        recommendation: 'Bundle this file locally in the extension package and update the manifest path to a relative local file.',
        sourceUrl: remoteHostedCodeSource,
      })
    }

    return manifestFinding({
      ruleId: 'CWS004',
      severity: 'medium',
      title: 'Manifest references a remote resource path',
      manifestPath: context.manifestPath,
      snippet,
      reason: `The manifest field ${ref.label} points to a remote URL. The local scanner cannot verify that remote asset inside the submitted ZIP.`,
      recommendation: 'Use a packaged local asset when Chrome expects an extension resource path, or confirm this field is allowed to point outside the ZIP.',
    })
  }

  if (ref.path.startsWith('/')) {
    return manifestFinding({
      ruleId: 'CWS004',
      severity: 'medium',
      title: 'Manifest path starts with a leading slash',
      manifestPath: context.manifestPath,
      snippet,
      reason: `The manifest field ${ref.label} uses an absolute-looking path. This scanner only verifies package-relative manifest paths.`,
      recommendation: 'Use a package-relative path without a leading slash, then rescan the final ZIP.',
    })
  }

  if (ref.path.includes('*')) {
    return manifestFinding({
      ruleId: 'CWS004',
      severity: ref.wildcardAllowed ? 'low' : 'medium',
      title: ref.wildcardAllowed ? 'Wildcard manifest resource was not existence-checked' : 'Manifest path contains a wildcard',
      manifestPath: context.manifestPath,
      snippet,
      reason: ref.wildcardAllowed
        ? `The manifest field ${ref.label} uses a wildcard pattern. The local scanner cannot prove every matched file exists or is intended.`
        : `The manifest field ${ref.label} contains a wildcard where this scanner expects a concrete package path.`,
      recommendation: ref.wildcardAllowed
        ? 'Manually verify that the wildcard only exposes intended packaged files.'
        : 'Replace the wildcard with a concrete packaged file path when Chrome expects a single resource.',
    })
  }

  if (isCheckableLocalPath(ref.path) && !context.files.has(ref.path)) {
    return manifestFinding({
      ruleId: 'CWS004',
      severity: 'high',
      title: 'Manifest references a missing file',
      manifestPath: context.manifestPath,
      snippet,
      reason: `The manifest references ${ref.path}, but that file was not found in the ZIP.`,
      recommendation: 'Add the missing file or correct the manifest path.',
    })
  }

  return undefined
}

export function runManifestRules(context: ScannerContext): Finding[] {
  const findings: Finding[] = []

  if (!context.manifestPath) {
    return [{ ruleId: 'CWS003', severity: 'high', title: 'manifest.json not found', reason: 'Chrome extensions require manifest.json in the submitted package.', recommendation: 'Place a valid manifest.json at the root of the zip.', sourceUrl: manifestSource }]
  }

  if (!context.manifestAtRoot) findings.push({ ruleId: 'CWS003', severity: 'high', title: 'manifest.json is not at the zip root', file: context.manifestPath, reason: 'The zip appears to contain a parent folder before manifest.json, which is a likely packaging mistake.', recommendation: 'Zip the extension contents directly so manifest.json is at the upload root.', sourceUrl: prepareSource })

  if (context.manifestParseError) {
    findings.push({ ruleId: 'CWS003', severity: 'high', title: 'manifest.json is invalid JSON', file: context.manifestPath, reason: context.manifestParseError, recommendation: 'Fix the JSON syntax and scan again.', sourceUrl: manifestSource })
    return findings
  }

  if (!context.manifest) return findings

  if (context.manifest.manifest_version !== 3) findings.push({ ruleId: 'CWS003', severity: 'high', title: 'Manifest is not Manifest V3', file: context.manifestPath, reason: `Expected manifest_version 3, found ${String(context.manifest.manifest_version)}.`, recommendation: 'Migrate to Manifest V3 before submitting.', sourceUrl: manifestSource })

  const seenRefs = new Set<string>()
  for (const ref of collectReferences(context.manifest)) {
    const key = `${ref.label}:${ref.path}`
    if (seenRefs.has(key)) continue
    seenRefs.add(key)
    const finding = reviewManifestReference(ref, context)
    if (finding) findings.push(finding)
  }

  return findings
}
