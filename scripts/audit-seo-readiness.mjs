import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (file) => readFile(join(root, file), 'utf8')

function hydratePages(rawPages, sharedPageData) {
  return rawPages.map((page) => ({
    ...page,
    sources: page.sources ?? page.sourceRefs?.map((ref) => sharedPageData.sources[ref]).filter(Boolean) ?? [],
    relatedLinks: page.relatedLinks ?? page.relatedLinkRefs?.map((ref) => sharedPageData.relatedLinks[ref]).filter(Boolean) ?? [],
  }))
}

const robots = await read('public/robots.txt')
assert.match(robots, /User-agent: \*\s+Allow: \//, 'robots.txt should allow the canonical public site')
assert.match(robots, /Sitemap: https:\/\/cws\.ymirtool\.com\/sitemap\.xml/, 'robots.txt should advertise the canonical sitemap')

const sitemap = await read('public/sitemap.xml')
assert.ok(!sitemap.includes('<priority>'), 'sitemap should avoid low-value priority noise')
for (const route of [
  '/',
  '/guides',
  '/chrome-web-store-rejection-checker',
  '/manifest-v3-pre-submission-checklist',
  '/fix-remote-hosted-code-manifest-v3',
  '/blue-argon-chrome-extension-error',
  '/chrome-extension-eval-rejection-fix',
  '/chrome-extension-host-permissions-privacy-review',
  '/privacy',
  '/how-it-works',
  '/about',
  '/terms',
  '/disclaimer',
  '/contact',
]) {
  assert.ok(sitemap.includes(`https://cws.ymirtool.com${route === '/' ? '/' : route}`), `sitemap should include ${route}`)
}

const indexHtml = await read('index.html')
assert.ok(indexHtml.includes('https://cws.ymirtool.com/'), 'home should expose canonical domain')
assert.ok(!indexHtml.includes('FAQPage'), 'legacy FAQPage JSON-LD should not return')
for (const asset of ['public/favicon.svg', 'public/favicon.ico', 'public/apple-touch-icon.png', 'public/og-image.png', 'public/icon-512.png', 'public/site.webmanifest']) {
  assert.ok(existsSync(join(root, asset)), `${asset} should exist`)
  const assetStat = await stat(join(root, asset))
  assert.ok(assetStat.size > 0, `${asset} should not be empty`)
}

const rawSeoPages = JSON.parse(await read('src/pages/seoPagesData.json'))
const sharedSeoPageData = JSON.parse(await read('src/pages/seoPageSharedData.json'))
const seoPages = hydratePages(rawSeoPages, sharedSeoPageData)
assert.ok(seoPages.some((page) => page.path === '/guides'), 'SEO page data should include /guides')
for (const page of seoPages) {
  assert.ok(page.metaTitle && page.metaTitle.length <= 60, `${page.path} should have a concise metaTitle`)
  assert.ok(page.description && page.description.length >= 120 && page.description.length <= 170, `${page.path} should have a SERP-ready description`)
  assert.ok(page.lastUpdated, `${page.path} should expose lastUpdated`)
  assert.ok(page.relatedLinks.length <= (page.path === '/guides' ? 8 : 3), `${page.path} should not over-list related links`)
}

console.log('SEO readiness audit passed.')
