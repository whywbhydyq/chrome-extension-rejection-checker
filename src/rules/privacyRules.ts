import type { Finding, ScannerContext } from '../core/types'

const sourceUrl = 'https://developer.chrome.com/docs/webstore/program-policies/policies'
const reviewPermissions = new Set(['storage', 'identity', 'cookies', 'history', 'tabs', 'bookmarks', 'downloads', 'topSites'])

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function runPrivacyRules(context: ScannerContext): Finding[] {
  if (!context.manifest) return []
  const permissions = [
    ...stringArray(context.manifest.permissions),
    ...stringArray(context.manifest.optional_permissions),
    ...stringArray(context.manifest.host_permissions),
    ...stringArray(context.manifest.optional_host_permissions),
  ]
  const triggers = permissions.filter((permission) => reviewPermissions.has(permission) || permission === '<all_urls>' || permission === '*://*/*')
  if (triggers.length === 0) return []

  return [{
    ruleId: 'CWS008',
    severity: 'medium',
    title: 'Privacy disclosure review needed',
    file: context.manifestPath,
    snippet: triggers.join(', '),
    reason: 'The extension uses permissions that may involve user data, browsing activity, or broad site access. This scanner cannot know the Developer Dashboard privacy fields.',
    recommendation: 'Review your Chrome Web Store privacy policy URL and privacy practices disclosures. Treat this as a checklist item, not an automatic violation.',
    sourceUrl,
  }]
}
