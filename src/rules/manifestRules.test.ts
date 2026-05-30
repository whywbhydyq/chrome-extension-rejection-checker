import { describe, expect, it } from 'vitest'
import { runManifestRules } from './manifestRules'
import type { ScannerContext, VirtualFile } from '../core/types'

function vf(path: string, text = ''): VirtualFile {
  const extension = path.includes('.') ? path.slice(path.lastIndexOf('.')) : ''
  return { path, normalizedPath: path, size: text.length, extension, isText: true, text }
}

function ctx(params: Partial<ScannerContext>): ScannerContext {
  const allFiles = params.allFiles ?? []
  return {
    zipName: 'fixture.zip',
    manifestAtRoot: true,
    rootPrefix: '',
    files: new Map(allFiles.map((file) => [file.normalizedPath, file])),
    allFiles,
    textFiles: allFiles,
    jsFiles: [],
    htmlFiles: [],
    scanLimits: [],
    ...params,
  }
}

describe('runManifestRules', () => {
  it('flags missing manifest as CWS003', () => {
    const findings = runManifestRules(ctx({ manifestPath: undefined, manifest: undefined }))
    expect(findings.some((finding) => finding.ruleId === 'CWS003')).toBe(true)
  })

  it('flags nested manifest as CWS003', () => {
    const findings = runManifestRules(ctx({ manifestPath: 'folder/manifest.json', manifestAtRoot: false, manifest: { manifest_version: 3 } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS003' && finding.title.includes('not at the zip root'))).toBe(true)
  })

  it('flags non-MV3 manifest as CWS003', () => {
    const findings = runManifestRules(ctx({ manifestPath: 'manifest.json', manifest: { manifest_version: 2 } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS003' && finding.title.includes('not Manifest V3'))).toBe(true)
  })

  it('flags missing options page as CWS004', () => {
    const files = [vf('manifest.json')]
    const findings = runManifestRules(ctx({ manifestPath: 'manifest.json', manifest: { manifest_version: 3, options_page: 'options.html' }, allFiles: files }))
    expect(findings.some((finding) => finding.ruleId === 'CWS004' && finding.snippet?.includes('options_page'))).toBe(true)
  })

  it('flags remote executable manifest references as CWS001', () => {
    const files = [vf('manifest.json')]
    const findings = runManifestRules(ctx({ manifestPath: 'manifest.json', manifest: { manifest_version: 3, background: { service_worker: 'https://cdn.example.com/sw.js' } }, allFiles: files }))
    expect(findings.some((finding) => finding.ruleId === 'CWS001' && finding.severity === 'high')).toBe(true)
  })

  it('flags leading slash manifest paths instead of silently skipping them', () => {
    const files = [vf('manifest.json'), vf('popup.html')]
    const findings = runManifestRules(ctx({ manifestPath: 'manifest.json', manifest: { manifest_version: 3, action: { default_popup: '/popup.html' } }, allFiles: files }))
    expect(findings.some((finding) => finding.ruleId === 'CWS004' && finding.title.includes('leading slash'))).toBe(true)
  })


  it('flags missing sandbox pages as manifest references', () => {
    const files = [vf('manifest.json')]
    const findings = runManifestRules(ctx({ manifestPath: 'manifest.json', manifest: { manifest_version: 3, sandbox: { pages: ['sandbox.html'] } }, allFiles: files }))
    expect(findings.some((finding) => finding.ruleId === 'CWS004' && finding.snippet?.includes('sandbox.pages'))).toBe(true)
  })


  it('does not flag existing referenced files', () => {
    const files = [vf('manifest.json'), vf('popup.html'), vf('icons/icon128.svg')]
    const findings = runManifestRules(ctx({ manifestPath: 'manifest.json', manifest: { manifest_version: 3, action: { default_popup: 'popup.html' }, icons: { '128': 'icons/icon128.svg' } }, allFiles: files }))
    expect(findings.some((finding) => finding.ruleId === 'CWS004')).toBe(false)
  })
})
