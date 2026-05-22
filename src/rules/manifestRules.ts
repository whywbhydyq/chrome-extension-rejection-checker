import type { Finding, ScannerContext } from '../core/types'

const manifestSource = 'https://developer.chrome.com/docs/extensions/reference/manifest'
const prepareSource = 'https://developer.chrome.com/docs/webstore/publish/preparing'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function collectReferences(manifest: Record<string, unknown>) {
  const refs: Array<{ path: string; label: string }> = []
  const background = isRecord(manifest.background) ? manifest.background : undefined
  const worker = stringValue(background?.service_worker)
  if (worker) refs.push({ path: worker, label: 'background.service_worker' })

  const action = isRecord(manifest.action) ? manifest.action : undefined
  const popup = stringValue(action?.default_popup)
  if (popup) refs.push({ path: popup, label: 'action.default_popup' })

  const icons = isRecord(manifest.icons) ? manifest.icons : {}
  for (const [size, path] of Object.entries(icons)) {
    const icon = stringValue(path)
    if (icon) refs.push({ path: icon, label: `icons.${size}` })
  }

  const contentScripts = Array.isArray(manifest.content_scripts) ? manifest.content_scripts : []
  contentScripts.forEach((item, index) => {
    if (!isRecord(item)) return
    for (const path of Array.isArray(item.js) ? item.js : []) if (stringValue(path)) refs.push({ path, label: `content_scripts[${index}].js` })
    for (const path of Array.isArray(item.css) ? item.css : []) if (stringValue(path)) refs.push({ path, label: `content_scripts[${index}].css` })
  })

  return refs
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

  for (const ref of collectReferences(context.manifest)) {
    if (!context.files.has(ref.path)) findings.push({ ruleId: 'CWS004', severity: 'high', title: 'Manifest references a missing file', file: context.manifestPath, snippet: `${ref.label}: ${ref.path}`, reason: `The manifest references ${ref.path}, but that file was not found in the zip.`, recommendation: 'Add the missing file or correct the manifest path.', sourceUrl: manifestSource })
  }

  return findings
}
