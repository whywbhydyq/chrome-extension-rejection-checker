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
    expect(findings.some((finding) => finding.ruleId === 'CWS005' && finding.title.includes('script-src'))).toBe(true)
  })

  it('flags scheme-only script-src sources', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "script-src 'self' https:; object-src 'self'" } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS005' && finding.snippet?.includes('https:'))).toBe(true)
  })

  it('flags default-src fallback when script-src is missing', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "default-src 'self' blob:; object-src 'self'" } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS005' && finding.title.includes('script-src'))).toBe(true)
  })


  it('flags remote worker-src sources', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "script-src 'self'; worker-src https://cdn.example.com; object-src 'self'" } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS005' && finding.title.includes('worker-src'))).toBe(true)
  })

  it('flags missing object-src on custom extension page CSP', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "script-src 'self'" } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS005' && finding.title.includes('object-src'))).toBe(true)
  })


  it('flags legacy string CSP format in Manifest V3', () => {
    const findings = runCspRules(ctx({ manifest_version: 3, content_security_policy: "script-src 'self'; object-src 'self'" }))
    expect(findings.some((finding) => finding.title.includes('legacy string format'))).toBe(true)
  })

  it('adds manual review when sandbox pages are present', () => {
    const findings = runCspRules(ctx({ manifest_version: 3, sandbox: { pages: ['sandbox.html'] }, content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'", sandbox: "sandbox allow-scripts; script-src 'self'" } }))
    expect(findings.some((finding) => finding.title.includes('Sandbox pages'))).toBe(true)
  })

  it('accepts local-only script-src', () => {
    const findings = runCspRules(ctx({ content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'" } }))
    expect(findings).toHaveLength(0)
  })
})
