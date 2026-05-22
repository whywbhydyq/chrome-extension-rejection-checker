import type { Finding, ScannerContext } from '../core/types'

const sourceUrl = 'https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions'
const sensitive = new Set(['tabs', 'webRequest', 'webRequestBlocking', 'debugger', 'cookies', 'history', 'identity', 'management', 'nativeMessaging', 'scripting'])

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function broad(permission: string): boolean {
  return permission === '<all_urls>' || permission === '*://*/*' || /^\*:\/\/\*\//.test(permission) || /^https?:\/\/\*\//.test(permission)
}

export function runPermissionRules(context: ScannerContext): Finding[] {
  if (!context.manifest) return []
  const findings: Finding[] = []
  const permissions = [...stringArray(context.manifest.permissions), ...stringArray(context.manifest.optional_permissions)]
  const hosts = [...stringArray(context.manifest.host_permissions), ...stringArray(context.manifest.optional_host_permissions), ...permissions.filter((p) => /^(<all_urls>|\*:\/\/|https?:\/\/)/.test(p))]

  for (const permission of hosts) {
    if (broad(permission)) findings.push({ ruleId: 'CWS006', severity: 'medium', title: 'Broad host permission found', file: context.manifestPath, snippet: permission, reason: 'Broad host permissions may increase Chrome Web Store review scrutiny and user warning impact.', recommendation: 'Use the narrowest host patterns possible, optional permissions, or activeTab when it fits the product.', sourceUrl })
  }

  for (const permission of permissions) {
    if (sensitive.has(permission)) findings.push({ ruleId: 'CWS007', severity: 'medium', title: 'Sensitive Chrome API permission found', file: context.manifestPath, snippet: permission, reason: 'This permission is not automatically forbidden, but it may require clear purpose, least-privilege usage, and privacy disclosure review.', recommendation: 'Confirm the permission is necessary and explain it clearly in the Chrome Web Store submission where required.', sourceUrl })
  }

  return findings
}
