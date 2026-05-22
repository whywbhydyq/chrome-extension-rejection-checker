import type { Finding, ScannerContext } from '../core/types'

const manifestSource = 'https://developer.chrome.com/docs/extensions/reference/manifest'
const prepareSource = 'https://developer.chrome.com/docs/webstore/publish/preparing'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
}

function addStringRef(refs: Array<{ path: string; label: string }>, value: unknown, label: string) {
  const path = stringValue(value)
  if (path) refs.push({ path, label })
}

function addRecordStringRefs(refs: Array<{ path: string; label: string }>, value: unknown, labelPrefix: string) {
  if (!isRecord(value)) return
  for (const [key, path] of Object.entries(value)) {
    const refPath = stringValue(path)
    if (refPath) refs.push({ path: refPath, label: `${labelPrefix}.${key}` })
  }
}

function isCheckablePath(path: string): boolean {
  if (/^https?:\/\//i.test(path)) return false
  if (path.includes('*')) return false
  if (path.startsWith('/')) return false
  return true
}

function collectReferences(manifest: Record<string, unknown>) {
  const refs: Array<{ path: string; label: string }> = []

  const background = isRecord(manifest.background) ? manifest.background : undefined
  addStringRef(refs, background?.service_worker, 'background.service_worker')

  const action = isRecord(manifest.action) ? manifest.action : undefined
  addStringRef(refs, action?.default_popup, 'action.default_popup')
  addRecordStringRefs(refs, action?.default_icon, 'action.default_icon')

  addStringRef(refs, manifest.options_page, 'options_page')
  const optionsUi = isRecord(manifest.options_ui) ? manifest.options_ui : undefined
  addStringRef(refs, optionsUi?.page, 'options_ui.page')
  addStringRef(refs, manifest.devtools_page, 'devtools_page')

  const sidePanel = isRecord(manifest.side_panel) ? manifest.side_panel : undefined
  addStringRef(refs, sidePanel?.default_path, 'side_panel.default_path')

  addRecordStringRefs(refs, manifest.icons, 'icons')

  const chromeUrlOverrides = isRecord(manifest.chrome_url_overrides) ? manifest.chrome_url_overrides : undefined
  addStringRef(refs, chromeUrlOverrides?.newtab, 'chrome_url_overrides.newtab')
  addStringRef(refs, chromeUrlOverrides?.bookmarks, 'chrome_url_overrides.bookmarks')
  addStringRef(refs, chromeUrlOverrides?.history, 'chrome_url_overrides.history')

  const contentScripts = Array.isArray(manifest.content_scripts) ? manifest.content_scripts : []
  contentScripts.forEach((item, index) => {
    if (!isRecord(item)) return
    stringArray(item.js).forEach((path, pathIndex) => refs.push({ path, label: `content_scripts[${index}].js[${pathIndex}]` }))
    stringArray(item.css).forEach((path, pathIndex) => refs.push({ path, label: `content_scripts[${index}].css[${pathIndex}]` }))
  })

  const webAccessibleResources = Array.isArray(manifest.web_accessible_resources) ? manifest.web_accessible_resources : []
  webAccessibleResources.forEach((item, index) => {
    if (!isRecord(item)) return
    stringArray(item.resources).forEach((path, pathIndex) => refs.push({ path, label: `web_accessible_resources[${index}].resources[${pathIndex}]` }))
  })

  const declarativeNetRequest = isRecord(manifest.declarative_net_request) ? manifest.declarative_net_request : undefined
  const ruleResources = Array.isArray(declarativeNetRequest?.rule_resources) ? declarativeNetRequest.rule_resources : []
  ruleResources.forEach((item, index) => {
    if (!isRecord(item)) return
    addStringRef(refs, item.path, `declarative_net_request.rule_resources[${index}].path`)
  })

  return refs.filter((ref) => isCheckablePath(ref.path))
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
    if (!context.files.has(ref.path)) findings.push({ ruleId: 'CWS004', severity: 'high', title: 'Manifest references a missing file', file: context.manifestPath, snippet: `${ref.label}: ${ref.path}`, reason: `The manifest references ${ref.path}, but that file was not found in the zip.`, recommendation: 'Add the missing file or correct the manifest path.', sourceUrl: manifestSource })
  }

  return findings
}
