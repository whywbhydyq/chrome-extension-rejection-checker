import { describe, expect, it } from 'vitest'
import { runCspRules } from './cspRules'
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

describe('runCspRules', () => {
  it('flags unsafe-eval in extension page CSP', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "script-src 'self' 'unsafe-eval'; object-src 'self'" } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS005' && finding.title.includes('unsafe-eval'))).toBe(true)
  })

  it('does not flag wasm-unsafe-eval by itself', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'" } }))
    expect(findings.some((finding) => finding.title.includes('unsafe-eval'))).toBe(false)
  })

  it('flags remote script-src sources', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "script-src 'self' https://cdn.example.com; object-src 'self'" } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS005' && finding.title.includes('remote script'))).toBe(true)
  })



  it('flags remote worker-src sources', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "script-src 'self'; worker-src https://cdn.example.com; object-src 'self'" } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS005' && finding.title.includes('worker'))).toBe(true)
  })

  it('flags missing object-src on custom extension page CSP', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "script-src 'self'" } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS005' && finding.title.includes('object-src'))).toBe(true)
  })

  it('accepts local-only script-src', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'" } }))
    expect(findings).toHaveLength(0)
  })
})
