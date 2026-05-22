import type { Finding, ScannerContext } from '../core/types'

const sourceUrl = 'https://developer.chrome.com/docs/extensions/develop/ui/add-icons'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function runIconRules(context: ScannerContext): Finding[] {
  if (!context.manifest) return []
  const icons = isRecord(context.manifest.icons) ? context.manifest.icons : undefined

  if (!icons || Object.keys(icons).length === 0) return [{ ruleId: 'CWS009', severity: 'medium', title: 'No extension icons declared', file: context.manifestPath, reason: 'The manifest does not declare icons.', recommendation: 'Add manifest icons. MVP checks path existence only; pixel size checks are P1.', sourceUrl }]

  const findings: Finding[] = []
  for (const [size, value] of Object.entries(icons)) {
    if (typeof value !== 'string') continue
    if (!context.files.has(value)) findings.push({ ruleId: 'CWS009', severity: 'medium', title: 'Declared icon file is missing', file: context.manifestPath, snippet: `icons.${size}: ${value}`, reason: `The manifest declares icon ${size} at ${value}, but that file was not found in the zip.`, recommendation: 'Add the icon file or correct the manifest path.', sourceUrl })
  }
  return findings
}
