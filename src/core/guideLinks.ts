import type { Finding, Severity } from './types'

export type GuideLink = {
  href: string
  label: string
  note: string
}

export type GuideAction = GuideLink & {
  ruleIds: string[]
  total: number
  high: number
  medium: number
  low: number
  prioritySeverity: Severity
}

const severityRank: Record<Severity, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export const defaultChecklistGuide: GuideLink = {
  href: '/manifest-v3-pre-submission-checklist',
  label: 'Review the Manifest V3 checklist',
  note: 'Use the full pre-submission checklist after fixing scan findings and before uploading to Chrome Web Store.',
}

export const ruleGuideMap: Record<string, GuideLink> = {
  CWS001: {
    href: '/fix-remote-hosted-code-manifest-v3',
    label: 'Fix remote hosted code',
    note: 'Bundle executable JavaScript or WebAssembly inside the submitted ZIP, then scan the rebuilt package.',
  },
  CWS002: {
    href: '/chrome-extension-eval-rejection-fix',
    label: 'Replace eval and dynamic code',
    note: 'Replace string-code execution with explicit functions, static imports, command maps, or structured data.',
  },
  CWS003: {
    href: '/manifest-v3-pre-submission-checklist',
    label: 'Fix Manifest V3 packaging',
    note: 'Verify manifest.json is valid, uses Manifest V3, and is located at the ZIP root.',
  },
  CWS004: {
    href: '/manifest-v3-pre-submission-checklist',
    label: 'Fix missing manifest references',
    note: 'Add the missing file to the release ZIP or correct the manifest path before resubmitting.',
  },
  CWS005: {
    href: '/chrome-extension-eval-rejection-fix',
    label: 'Fix extension CSP issues',
    note: 'Remove unsafe script execution and keep extension page script sources local to the package.',
  },
  CWS006: {
    href: '/chrome-extension-host-permissions-privacy-review',
    label: 'Review broad host permissions',
    note: 'Use the narrowest host patterns possible, optional permissions, or activeTab when appropriate.',
  },
  CWS007: {
    href: '/chrome-extension-host-permissions-privacy-review',
    label: 'Justify sensitive permissions',
    note: 'Confirm each sensitive API supports the extension single purpose and is clearly disclosed.',
  },
  CWS008: {
    href: '/chrome-extension-host-permissions-privacy-review',
    label: 'Review privacy disclosures',
    note: 'Check Developer Dashboard privacy fields, policy URL, listing copy, and reviewer notes separately.',
  },
  CWS009: {
    href: '/manifest-v3-pre-submission-checklist',
    label: 'Fix icon and manifest assets',
    note: 'Add common icon sizes and make manifest paths match files in the release ZIP.',
  },
  CWS010: {
    href: '/fix-remote-hosted-code-manifest-v3',
    label: 'Review remote URL usage',
    note: 'Confirm remote URLs are not used to load or execute JavaScript or WebAssembly.',
  },
}

export function guideForFinding(finding: Finding): GuideLink | undefined {
  return ruleGuideMap[finding.ruleId]
}

export function guideActionsForFindings(findings: Finding[]): GuideAction[] {
  const actions = new Map<string, GuideAction>()

  for (const finding of findings) {
    const guide = guideForFinding(finding)
    if (!guide) continue

    const existing = actions.get(guide.href)
    if (existing) {
      existing.total += 1
      existing[finding.severity] += 1
      if (!existing.ruleIds.includes(finding.ruleId)) existing.ruleIds.push(finding.ruleId)
      if (severityRank[finding.severity] < severityRank[existing.prioritySeverity]) {
        existing.prioritySeverity = finding.severity
      }
      continue
    }

    actions.set(guide.href, {
      ...guide,
      ruleIds: [finding.ruleId],
      total: 1,
      high: finding.severity === 'high' ? 1 : 0,
      medium: finding.severity === 'medium' ? 1 : 0,
      low: finding.severity === 'low' ? 1 : 0,
      prioritySeverity: finding.severity,
    })
  }

  return Array.from(actions.values()).sort((a, b) => {
    const severityDelta = severityRank[a.prioritySeverity] - severityRank[b.prioritySeverity]
    if (severityDelta !== 0) return severityDelta
    return b.total - a.total
  })
}
