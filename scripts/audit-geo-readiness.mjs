import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

async function read(path) {
  return readFile(path, 'utf8')
}

function warn(message) {
  console.warn(`GEO warning: ${message}`)
}

function wordCount(value) {
  return String(value).split(/\s+/).filter(Boolean).length
}

function hydratePages(rawPages, sharedPageData) {
  return rawPages.map((page) => ({
    ...page,
    sources: page.sources ?? page.sourceRefs?.map((ref) => sharedPageData.sources[ref]).filter(Boolean) ?? [],
    relatedLinks: page.relatedLinks ?? page.relatedLinkRefs?.map((ref) => sharedPageData.relatedLinks[ref]).filter(Boolean) ?? [],
  }))
}

const rawPages = JSON.parse(await read('src/pages/seoPagesData.json'))
const sharedPageData = JSON.parse(await read('src/pages/seoPageSharedData.json'))
const pages = hydratePages(rawPages, sharedPageData)
const robots = await read('public/robots.txt')
const sitemap = await read('public/sitemap.xml')
const index = await read('index.html')

if (existsSync('public/llms.txt')) {
  const llms = await read('public/llms.txt')
  if (!llms.includes('# Chrome Extension Rejection Checker')) warn('llms.txt exists but does not start with the site title')
  if (!llms.includes('## Primary pages')) warn('llms.txt exists but does not list primary pages')
  if (!llms.includes('## Key facts')) warn('llms.txt exists but does not expose key facts for AI readers')
  if (!llms.includes('https://cws.ymirtool.com/guides')) warn('llms.txt exists but does not include the guide hub')
} else {
  warn('llms.txt is optional and not present')
}

for (const bot of ['OAI-SearchBot', 'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot']) {
  if (!robots.includes(`User-agent: ${bot}`)) {
    warn(`robots.txt does not explicitly mention ${bot}; this is allowed because User-agent: * already permits crawling`)
  }
}

assert.ok(sitemap.includes('https://cws.ymirtool.com/guides'), 'sitemap should include /guides')
assert.ok(index.includes('/guides'), 'home static HTML should link to /guides')

const guideHub = pages.find((page) => page.path === '/guides')
assert.ok(guideHub, 'SEO page data should include /guides')
assert.ok(guideHub.relatedLinks.length >= 6, '/guides should list all core guides')
assert.ok(guideHub.sources.length >= 4, '/guides should cite official sources')
assert.ok(guideHub.reviewMethod?.checks?.length >= 4, '/guides should expose review method checks')

for (const page of pages) {
  assert.ok(page.lastUpdated, `${page.path} should expose lastUpdated`)
  assert.ok(page.description.length >= 120 && page.description.length <= 170, `${page.path} description should stay within practical snippet range`)
  if (page.path !== '/privacy' && page.path !== '/how-it-works') {
    assert.ok(page.sources?.length >= 3, `${page.path} should cite source basis`)
  }
  const visibleWords = [
    page.title,
    page.description,
    ...(page.sections ?? []).map((item) => `${item.heading} ${item.body}`),
    ...(page.contentBlocks ?? []).map((item) => `${item.heading} ${item.body} ${(item.bullets ?? []).join(' ')}`),
    ...(page.checklist ?? []),
    ...(page.examples ?? []).map((item) => `${item.title} ${item.body}`),
    ...(page.faqs ?? []).map((item) => `${item.question} ${item.answer}`),
  ].join(' ')
  assert.ok(wordCount(visibleWords) >= 550, `${page.path} should have enough self-contained body content for static rendering`)
}

console.log('GEO readiness audit passed with optional AI-reader warnings only.')
