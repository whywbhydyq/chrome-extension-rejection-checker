import { describe, expect, it } from 'vitest'
import { runIconRules } from './iconRules'
import type { ScannerContext, VirtualFile } from '../core/types'

function vf(path: string, text = '', bytes?: Uint8Array): VirtualFile {
  const extension = path.includes('.') ? path.slice(path.lastIndexOf('.')) : ''
  return { path, normalizedPath: path, size: bytes?.length ?? text.length, extension, isText: Boolean(text), text: text || undefined, bytes }
}

function ctx(manifest: Record<string, unknown> | undefined, files: VirtualFile[] = []): ScannerContext {
  return {
    zipName: 'fixture.zip',
    manifestPath: 'manifest.json',
    manifestAtRoot: true,
    manifest,
    rootPrefix: '',
    files: new Map(files.map((file) => [file.normalizedPath, file])),
    allFiles: files,
    textFiles: files.filter((file) => file.isText),
    jsFiles: [],
    htmlFiles: [],
    scanLimits: [],
  }
}

function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24)
  bytes.set([0x89, 0x50, 0x4e, 0x47], 0)
  const view = new DataView(bytes.buffer)
  view.setUint32(16, width)
  view.setUint32(20, height)
  return bytes
}

describe('runIconRules', () => {
  it('flags missing icon declaration as CWS009', () => {
    const findings = runIconRules(ctx({ manifest_version: 3 }))
    expect(findings.some((finding) => finding.ruleId === 'CWS009' && finding.title.includes('No extension icons'))).toBe(true)
  })

  it('flags declared icon files that are missing', () => {
    const findings = runIconRules(ctx({ manifest_version: 3, icons: { '128': 'icons/icon128.png' } }))
    expect(findings.some((finding) => finding.ruleId === 'CWS009' && finding.title.includes('missing'))).toBe(true)
  })

  it('flags common icon sizes that are not declared', () => {
    const file = vf('icons/icon128.svg', '<svg width="128" height="128"></svg>')
    const findings = runIconRules(ctx({ manifest_version: 3, icons: { '128': 'icons/icon128.svg' } }, [file]))
    expect(findings.some((finding) => finding.snippet === 'icons.16')).toBe(true)
  })

  it('flags mismatched SVG dimensions', () => {
    const file = vf('icons/icon128.svg', '<svg width="64" height="64"></svg>')
    const findings = runIconRules(ctx({ manifest_version: 3, icons: { '128': 'icons/icon128.svg', '16': 'icons/icon128.svg', '32': 'icons/icon128.svg', '48': 'icons/icon128.svg' } }, [file]))
    expect(findings.some((finding) => finding.title.includes('does not match'))).toBe(true)
  })

  it('accepts matching PNG dimensions', () => {
    const icon16 = vf('icons/icon16.png', '', pngHeader(16, 16))
    const icon32 = vf('icons/icon32.png', '', pngHeader(32, 32))
    const icon48 = vf('icons/icon48.png', '', pngHeader(48, 48))
    const icon128 = vf('icons/icon128.png', '', pngHeader(128, 128))
    const findings = runIconRules(ctx({
      manifest_version: 3,
      icons: {
        '16': 'icons/icon16.png',
        '32': 'icons/icon32.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png',
      },
    }, [icon16, icon32, icon48, icon128]))
    expect(findings.some((finding) => finding.title.includes('does not match'))).toBe(false)
  })
})
