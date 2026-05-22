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
  }
}

describe('runRemoteCodeRules', () => {
  it('flags remote script tags as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('popup.html', '<script src="https://example.com/app.js"></script>')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001')).toBe(true)
  })

  it('flags importScripts from remote URLs as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('background.js', 'importScripts("https://example.com/worker.js")')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001')).toBe(true)
  })

  it('flags remote JavaScript URL assignment as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('content.js', 'script.src = "https://example.com/widget.js"')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001')).toBe(true)
  })

  it('does not flag local dynamic script creation by itself as CWS001', () => {
    const findings = runRemoteCodeRules(ctx([vf('content.js', 'const script = document.createElement("script"); script.src = "local.js"')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS001')).toBe(false)
  })

  it('flags dynamic execution as CWS002', () => {
    const findings = runRemoteCodeRules(ctx([vf('content.js', 'new Function("return 1")')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS002')).toBe(true)
  })

  it('does not treat manifest host permissions as CWS010', () => {
    const findings = runRemoteCodeRules(ctx([vf('manifest.json', '{"host_permissions":["https://example.com/*"]}')]))
    expect(findings.some((finding) => finding.ruleId === 'CWS010')).toBe(false)
  })
})
