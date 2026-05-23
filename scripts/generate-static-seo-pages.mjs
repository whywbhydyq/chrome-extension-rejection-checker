import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const siteUrl = 'https://chrome-extension-rejection-checker.vercel.app'

const pages = [
  {
    path: '/chrome-web-store-rejection-checker',
    title: 'Free local Chrome Web Store rejection checker – Chrome Extension Rejection Checker',
    description: 'Scan a Chrome extension ZIP locally before submission and catch common Manifest V3 rejection risks without uploading source code.',
  },
  {
    path: '/manifest-v3-pre-submission-checklist',
    title: 'Manifest V3 pre-submission checklist for Chrome extensions – Chrome Extension Rejection Checker',
    description: 'Check that manifest.json is valid, at the ZIP root, uses Manifest V3, and references files that actually exist in your package.',
  },
  {
    path: '/fix-remote-hosted-code-manifest-v3',
    title: 'Fix remotely hosted code issues in Manifest V3 extensions – Chrome Extension Rejection Checker',
    description: 'Find remote script tags, importScripts calls, remote JavaScript imports, remote WebAssembly execution paths, and remote JS URL assignments.',
  },
  {
    path: '/chrome-extension-eval-rejection-fix',
    title: 'Chrome extension eval() and dynamic code rejection fix – Chrome Extension Rejection Checker',
    description: 'Find eval, new Function, and string-based timers that can trigger Chrome extension CSP and review problems.',
  },
  {
    path: '/chrome-extension-host-permissions-privacy-review',
    title: 'Chrome extension host permissions and privacy review checklist – Chrome Extension Rejection Checker',
    description: 'Review broad host permissions, sensitive Chrome APIs, privacy disclosure reminders, and Developer Dashboard fields before publishing.',
  },
]

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function replaceMeta(html, page) {
  const canonical = `${siteUrl}${page.path}`
  const escapedTitle = escapeHtml(page.title)
  const escapedDescription = escapeHtml(page.description)
  const escapedCanonical = escapeHtml(canonical)

  return html
    .replace(/<title>.*?<\/title>/s, `<title>${escapedTitle}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/s, `<meta name="description" content="${escapedDescription}" />`)
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/s, `<link rel="canonical" href="${escapedCanonical}" />`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/s, `<meta property="og:url" content="${escapedCanonical}" />`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/s, `<meta property="og:title" content="${escapedTitle}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/s, `<meta property="og:description" content="${escapedDescription}" />`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/s, `<meta name="twitter:title" content="${escapedTitle}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/s, `<meta name="twitter:description" content="${escapedDescription}" />`)
}

const templatePath = join(process.cwd(), 'dist', 'index.html')
const template = await readFile(templatePath, 'utf8')

for (const page of pages) {
  const outputPath = join(process.cwd(), 'dist', page.path, 'index.html')
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, replaceMeta(template, page))
}

console.log(`Generated ${pages.length} static SEO page shells.`)
