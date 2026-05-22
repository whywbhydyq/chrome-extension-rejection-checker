import type { Finding, ScannerContext, VirtualFile } from '../core/types'

const sourceUrl = 'https://developer.chrome.com/docs/extensions/develop/ui/add-icons'
const recommendedSizes = new Set(['16', '32', '48', '128'])

type Dimensions = { width: number; height: number }

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readPngDimensions(file: VirtualFile): Dimensions | undefined {
  const bytes = file.bytes
  if (!bytes || bytes.length < 24) return undefined
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  if (!isPng) return undefined
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

function readSvgDimensions(file: VirtualFile): Dimensions | undefined {
  const text = file.text
  if (!text) return undefined
  const width = text.match(/\bwidth=["']?(\d+(?:\.\d+)?)/i)?.[1]
  const height = text.match(/\bheight=["']?(\d+(?:\.\d+)?)/i)?.[1]
  if (width && height) return { width: Number(width), height: Number(height) }

  const viewBox = text.match(/\bviewBox=["']\s*[-\d.]+\s+[-\d.]+\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i)
  if (viewBox) return { width: Number(viewBox[1]), height: Number(viewBox[2]) }
  return undefined
}

function readIconDimensions(file: VirtualFile): Dimensions | undefined {
  if (file.extension === '.png') return readPngDimensions(file)
  if (file.extension === '.svg') return readSvgDimensions(file)
  return undefined
}

export function runIconRules(context: ScannerContext): Finding[] {
  if (!context.manifest) return []
  const icons = isRecord(context.manifest.icons) ? context.manifest.icons : undefined

  if (!icons || Object.keys(icons).length === 0) return [{ ruleId: 'CWS009', severity: 'medium', title: 'No extension icons declared', file: context.manifestPath, reason: 'The manifest does not declare icons.', recommendation: 'Add manifest icons, especially common sizes such as 16, 32, 48, and 128.', sourceUrl }]

  const findings: Finding[] = []
  const declaredSizes = new Set(Object.keys(icons))

  for (const size of recommendedSizes) {
    if (!declaredSizes.has(size)) {
      findings.push({ ruleId: 'CWS009', severity: 'medium', title: 'Common icon size is not declared', file: context.manifestPath, snippet: `icons.${size}`, reason: `The manifest does not declare a ${size}x${size} icon.`, recommendation: 'Declare common icon sizes such as 16, 32, 48, and 128 when available.', sourceUrl })
    }
  }

  for (const [size, value] of Object.entries(icons)) {
    if (typeof value !== 'string') continue
    const iconFile = context.files.get(value)
    if (!iconFile) {
      findings.push({ ruleId: 'CWS009', severity: 'medium', title: 'Declared icon file is missing', file: context.manifestPath, snippet: `icons.${size}: ${value}`, reason: `The manifest declares icon ${size} at ${value}, but that file was not found in the zip.`, recommendation: 'Add the icon file or correct the manifest path.', sourceUrl })
      continue
    }

    const expected = Number(size)
    const dimensions = readIconDimensions(iconFile)
    if (Number.isFinite(expected) && dimensions && (dimensions.width !== expected || dimensions.height !== expected)) {
      findings.push({ ruleId: 'CWS009', severity: 'medium', title: 'Declared icon size does not match image dimensions', file: iconFile.normalizedPath, snippet: `declared ${size}x${size}, actual ${dimensions.width}x${dimensions.height}`, reason: `The manifest declares this icon as ${size}x${size}, but the image dimensions appear to be ${dimensions.width}x${dimensions.height}.`, recommendation: 'Use an image whose actual pixel dimensions match the manifest icon size, or update the manifest key.', sourceUrl })
    }
  }
  return findings
}
