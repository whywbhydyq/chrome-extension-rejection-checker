import { describe, expect, it } from 'vitest'
import { runPrivacyRules } from './privacyRules'
import type { ScannerContext } from '../core/types'

function ctx(manifest: Record<string, unknown> | undefined): ScannerContext {
  return {
    zipName: 'fixture.zip',
    manifestPath: 'manifest.json',
    manifestAtRoot: true,
    manifest,
    rootPrefix: '',
    files: new Map(),
    allFiles: [],
    textFiles: [],
    jsFiles: [],
    htmlFiles: [],
    scanLimits: [],
  }
}

describe('runPrivacyRules', () => {
  it('flags user-data related permissions as CWS008', () => {
    const findings = runPrivacyRules(ctx({ manifest_version: 3, permissions: ['storage', 'tabs'] }))
    expect(findings).toHaveLength(1)
    expect(findings[0].ruleId).toBe('CWS008')
    expect(findings[0].snippet).toContain('storage')
    expect(findings[0].snippet).toContain('tabs')
  })

  it('flags broad host permissions for privacy review', () => {
    const findings = runPrivacyRules(ctx({ manifest_version: 3, host_permissions: ['<all_urls>'] }))
    expect(findings.some((finding) => finding.ruleId === 'CWS008')).toBe(true)
  })

  it('does not flag unrelated permissions', () => {
    const findings = runPrivacyRules(ctx({ manifest_version: 3, permissions: ['alarms'] }))
    expect(findings).toHaveLength(0)
  })

  it('returns no findings without a manifest', () => {
    expect(runPrivacyRules(ctx(undefined))).toHaveLength(0)
  })
})
