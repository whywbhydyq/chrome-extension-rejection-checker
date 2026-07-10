import type { Finding, ScanReport, ScannerContext } from './types'
import { runCspRules } from '../rules/cspRules'
import { runIconRules } from '../rules/iconRules'
import { runManifestRules } from '../rules/manifestRules'
import { runPermissionRules } from '../rules/permissionRules'
import { runPrivacyRules } from '../rules/privacyRules'
import { runRemoteCodeRules } from '../rules/remoteCodeRules'

export const rulesVersion = '2026-05-30-mv3-static-rules'

export type RuleRunner = (context: ScannerContext) => Finding[]

const ruleRunners: RuleRunner[] = [
  runManifestRules,
  runRemoteCodeRules,
  runCspRules,
  runPermissionRules,
  runPrivacyRules,
  runIconRules,
]

export function scanContext(context: ScannerContext): ScanReport {
  const findings = ruleRunners.flatMap((runner) => runner(context))
  const summary = {
    total: findings.length,
    high: findings.filter((finding) => finding.severity === 'high').length,
    medium: findings.filter((finding) => finding.severity === 'medium').length,
    low: findings.filter((finding) => finding.severity === 'low').length,
  }

  return {
    zipName: context.zipName,
    scannedAt: new Date().toISOString(),
    manifestPath: context.manifestPath,
    summary,
    findings,
    manualChecklist: [
      { title: 'Developer Dashboard privacy policy URL', description: 'Verify that the Chrome Web Store privacy policy URL is accurate and current when user data is involved.' },
      { title: 'Privacy practices fields', description: 'Review data-use disclosures in the Developer Dashboard. These fields are not stored in the zip.' },
      { title: 'Permission justifications', description: 'Make sure broad and sensitive permissions are tied to the extension single purpose.' },
      { title: 'Single purpose description', description: 'Confirm that the extension purpose is narrow, clear, and consistent across the manifest, listing, screenshots, and reviewer notes.' },
      { title: 'Store listing description accuracy', description: 'Check that listing copy, screenshots, claims, and permissions describe the same behavior as the submitted ZIP.' },
      { title: 'Version number and release notes', description: 'Confirm the submitted manifest version, package contents, release notes, and reviewer notes all describe the intended release.' },
      { title: 'Account and item policy compliance', description: 'Review account standing, item policy requirements, branding, impersonation, user data, ads, and prohibited content requirements outside the ZIP scanner.' },
    ],
    rulesVersion,
    scanLimits: context.scanLimits,
  }
}
