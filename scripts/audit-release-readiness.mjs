import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (file) => readFile(join(root, file), 'utf8')

const packageJson = JSON.parse(await read('package.json'))
assert.equal(packageJson.private, true, 'project should remain private unless release policy changes')
assert.ok(packageJson.engines?.node, 'package.json must declare the Node engine required by Vite tooling')
assert.ok(packageJson.scripts?.typecheck === 'tsc -b', 'typecheck script should remain available')
assert.ok(packageJson.scripts?.build?.includes('scripts/audit-vercel-routing.mjs'), 'build should run the routing audit before Vite output')
assert.ok(packageJson.scripts?.build?.includes('scripts/generate-static-seo-pages.mjs'), 'build should generate static SEO pages')

const gitignore = await read('.gitignore')
const gitignoreEntries = gitignore.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
for (const ignored of ['node_modules', 'dist', '.vercel', '.seo-cache']) {
  assert.ok(gitignoreEntries.includes(ignored) || gitignoreEntries.includes(`${ignored}/`), `.gitignore should ignore ${ignored}`)
}

const archiveScript = await read('scripts/build-archives.mjs')
for (const excluded of ['node_modules', 'dist', '.git', '.vercel', '.seo-cache', 'coverage']) {
  assert.ok(archiveScript.includes(`'${excluded}'`), `archive script should exclude ${excluded}`)
}
for (const included of ['package.json', 'package-lock.json', 'scripts', 'docs']) {
  assert.ok(archiveScript.includes(included), `source archive should include ${included}`)
}

const vercel = JSON.parse(await read('vercel.json'))
assert.equal(vercel.framework, 'vite', 'Vercel framework should be Vite')
assert.equal(vercel.buildCommand, 'npm run build', 'Vercel build command should be npm run build')
assert.equal(vercel.outputDirectory, 'dist', 'Vercel output directory should be dist')
assert.ok(!JSON.stringify(vercel.rewrites).includes('"source":"/(.*)"'), 'unknown URLs must not rewrite to the homepage')

const robots = await read('public/robots.txt')
assert.match(robots, /Sitemap: https:\/\/cws\.ymirtool\.com\/sitemap\.xml/, 'robots.txt should advertise the canonical sitemap')
const sitemap = await read('public/sitemap.xml')
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
for (const asset of ['/favicon.svg', '/favicon.ico', '/apple-touch-icon.png', '/og-image.png', '/site.webmanifest']) {
  assert.ok(indexHtml.includes(asset), `index.html should reference ${asset}`)
}
assert.ok(!indexHtml.includes('FAQPage'), 'legacy FAQPage JSON-LD should not return')

for (const asset of ['public/favicon.svg', 'public/favicon.ico', 'public/apple-touch-icon.png', 'public/og-image.png', 'public/icon-512.png', 'public/site.webmanifest']) {
  assert.ok(existsSync(join(root, asset)), `${asset} should exist`)
  const assetStat = await stat(join(root, asset))
  assert.ok(assetStat.size > 0, `${asset} should not be empty`)
}

if (!existsSync(join(root, 'public/llms.txt'))) {
  console.warn('Release warning: public/llms.txt is optional and not present.')
}

const rawSeoPages = JSON.parse(await read('src/pages/seoPagesData.json'))
const sharedSeoPageData = JSON.parse(await read('src/pages/seoPageSharedData.json'))
const seoPages = rawSeoPages.map((page) => ({
  ...page,
  sources: page.sources ?? page.sourceRefs?.map((ref) => sharedSeoPageData.sources[ref]).filter(Boolean) ?? [],
  relatedLinks: page.relatedLinks ?? page.relatedLinkRefs?.map((ref) => sharedSeoPageData.relatedLinks[ref]).filter(Boolean) ?? [],
}))
assert.ok(Array.isArray(seoPages) && seoPages.length >= 9, 'SEO page data should contain the expected route set plus guide hub')
assert.ok(seoPages.some((page) => page.path === '/guides'), 'SEO page data should include /guides')
for (const page of seoPages) {
  assert.ok(page.metaTitle && page.metaTitle.length <= 60, `${page.path} should have a concise metaTitle`)
  assert.ok(page.description && page.description.length >= 120 && page.description.length <= 170, `${page.path} should have a SERP-ready description`)
  assert.ok(page.lastUpdated, `${page.path} should expose lastUpdated`)
  if (!['/privacy', '/how-it-works'].includes(page.path)) {
    assert.ok(page.reviewMethod, `${page.path} should include reviewMethod`)
  }
}

const sourceText = [
  indexHtml,
  await read('scripts/generate-static-seo-pages.mjs'),
  await read('src/pages/SeoPage.tsx'),
].join('\n')
assert.ok(!sourceText.includes('createFaqSchema'), 'createFaqSchema should not return')
assert.ok(!sourceText.includes('FAQPage'), 'FAQPage schema should not return')

const fixtureDirs = await readdir(join(root, 'fixtures-src'), { withFileTypes: true })
const fixtureNames = fixtureDirs.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
for (const fixture of ['valid-mv3-extension', 'remote-script-extension', 'dynamic-code-extension', 'eval-extension', 'packaging-mistake-extension', 'missing-manifest-extension']) {
  assert.ok(fixtureNames.includes(fixture), `fixture source should include ${fixture}`)
}

console.log('Release readiness audit passed.')
