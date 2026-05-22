import { describe, expect, it } from 'vitest'
import { runPermissionRules } from './permissionRules'
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
  }
}

describe('runPermissionRules', () => {
  it('flags broad host permissions as CWS006', () => {
    const findings = runPermissionRules(ctx({ manifest_version: 3, host_permissions: ['<all_urls>'] }))
    expect(findings.some((finding) => finding.ruleId === 'CWS006' && finding.severity === 'medium')).toBe(true)
  })

  it('flags wildcard URL permissions from permissions as CWS006', () => {
    const findings = runPermissionRules(ctx({ manifest_version: 3, permissions: ['*://*/*'] }))
    expect(findings.some((finding) => finding.ruleId === 'CWS006')).toBe(true)
  })

  it('flags sensitive Chrome API permissions as CWS007', () => {
    const findings = runPermissionRules(ctx({ manifest_version: 3, permissions: ['scripting', 'tabs'] }))
    expect(findings.filter((finding) => finding.ruleId === 'CWS007')).toHaveLength(2)
  })

  it('does not flag narrow host permissions as broad', () => {
    const findings = runPermissionRules(ctx({ manifest_version: 3, host_permissions: ['https://example.com/*'] }))
    expect(findings.some((finding) => finding.ruleId === 'CWS006')).toBe(false)
  })

  it('returns no findings when no reviewed permissions are present', () => {
    const findings = runPermissionRules(ctx({ manifest_version: 3, permissions: ['storage'] }))
    expect(findings.some((finding) => finding.ruleId === 'CWS006' || finding.ruleId === 'CWS007')).toBe(false)
  })
})
