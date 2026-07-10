import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const siteUrl = 'https://cws.ymirtool.com'
const dataPath = join(process.cwd(), 'src', 'pages', 'seoPagesData.json')
const pages = JSON.parse(await readFile(dataPath, 'utf8'))

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#96;')
}

function createFaqSchema(page) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }, null, 6)
}

function createSoftwareSchema(page) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': ['SoftwareApplication', 'WebApplication'],
    name: page.path === '/' ? 'Chrome Extension Rejection Checker' : page.title,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: `${siteUrl}${page.path}`,
    description: page.description,
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Local ZIP scan',
      'Manifest V3 preflight check',
      'Remote hosted code detection',
      'Dynamic code execution detection',
      'CSP review',
      'Permission and privacy review reminders',
    ],
  }, null, 6)
}

function replaceOrInsertHeadTag(html, matcher, replacement) {
  if (matcher.test(html)) return html.replace(matcher, replacement)
  return html.replace('</head>', `    ${replacement}\n  </head>`)
}

function replaceJsonLd(html, page) {
  const faqMarker = /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "FAQPage",[\s\S]*?\n    <\/script>/
  const softwareMarker = /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "SoftwareApplication",[\s\S]*?\n    <\/script>/
  let nextHtml = replaceOrInsertHeadTag(
    html,
    softwareMarker,
    `    <script type="application/ld+json">\n      ${createSoftwareSchema(page)}\n    </script>`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    faqMarker,
    `    <script type="application/ld+json">\n      ${createFaqSchema(page)}\n    </script>`,
  )
  return nextHtml
}

function renderCardGrid(items) {
  return items
    .map(
      (item) => `
              <section class="rounded-2xl bg-slate-50 p-5">
                <h3 class="font-bold">${escapeHtml(item.heading ?? item.title)}</h3>
                <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(item.body)}</p>
              </section>`,
    )
    .join('')
}


function renderContentBlocks(blocks) {
  if (!blocks || blocks.length === 0) return ''
  return `

        <section class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="practical-notes-title">
          <p class="text-sm font-bold uppercase tracking-widest text-slate-500">Practical notes</p>
          <h2 id="practical-notes-title" class="mt-3 text-3xl font-black tracking-tight">How to apply this before resubmission</h2>
          <div class="mt-6 space-y-5">${blocks.map((block) => {
            const bullets = block.bullets && block.bullets.length > 0
              ? `<ul class="mt-4 space-y-2 text-sm leading-6 text-slate-700">${block.bullets.map((bullet) => `
                <li class="flex gap-2"><span class="font-bold text-slate-950">•</span><span>${escapeHtml(bullet)}</span></li>`).join('')}
              </ul>`
              : ''
            const cta = block.ctaLabel && block.ctaHref
              ? `<a class="mt-4 inline-block text-sm font-semibold underline" href="${escapeAttribute(block.ctaHref)}">${escapeHtml(block.ctaLabel)}</a>`
              : ''
            return `
            <section class="rounded-2xl bg-slate-50 p-5">
              <h3 class="font-bold text-slate-950">${escapeHtml(block.heading)}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(block.body)}</p>${bullets}
              ${cta}
            </section>`
          }).join('')}
          </div>
        </section>`
}

function renderChecklist(items) {
  return items
    .map(
      (item) => `
            <li class="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <span class="font-bold text-slate-950">□</span> ${escapeHtml(item)}
            </li>`,
    )
    .join('')
}

function renderFaqs(items) {
  return items
    .map(
      (faq) => `
            <section class="rounded-2xl bg-slate-50 p-5">
              <h3 class="font-bold">${escapeHtml(faq.question)}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(faq.answer)}</p>
            </section>`,
    )
    .join('')
}

function renderRelatedLinks(items) {
  return items
    .map(
      (link) => `
            <a class="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" href="${escapeAttribute(link.href)}">
              ${escapeHtml(link.label)}
            </a>`,
    )
    .join('')
}

function renderPrivacyAdvertisingDisclosure(page) {
  if (page.path !== '/privacy') return ''
  return `

        <section class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="advertising-disclosure-title">
          <p class="text-sm font-bold uppercase tracking-widest text-slate-500">Advertising disclosure</p>
          <h2 id="advertising-disclosure-title" class="mt-3 text-3xl font-black tracking-tight">Google advertising cookies and choices</h2>
          <div class="mt-6 grid gap-5 md:grid-cols-3">
            <section class="rounded-2xl bg-slate-50 p-5">
              <h3 class="font-bold">Third-party advertising cookies</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">This site may use Google AdSense. Third-party vendors, including Google, may use cookies to serve ads based on prior visits to this site or other websites.</p>
            </section>
            <section class="rounded-2xl bg-slate-50 p-5">
              <h3 class="font-bold">Personalized ads</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Google's advertising cookies enable Google and its partners to serve ads based on visits to this site and other sites on the Internet.</p>
            </section>
            <section class="rounded-2xl bg-slate-50 p-5">
              <h3 class="font-bold">Opt-out choices</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Users can opt out of personalized advertising in <a class="font-semibold underline" href="https://adssettings.google.com/" rel="nofollow">Google Ads Settings</a> or review broader choices through <a class="font-semibold underline" href="https://www.aboutads.info/choices/" rel="nofollow">AboutAds</a>.</p>
            </section>
          </div>
        </section>`
}



function renderToolCta(cta) {
  if (!cta) return ''
  const secondary = cta.secondaryLabel && cta.secondaryHref
    ? `<a class="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30" href="${escapeAttribute(cta.secondaryHref)}">${escapeHtml(cta.secondaryLabel)}</a>`
    : ''
  return `

        <section class="rounded-3xl bg-slate-950 p-6 text-white shadow-sm md:p-8" aria-labelledby="tool-cta-title">
          <p class="text-sm font-bold uppercase tracking-widest text-slate-300">${escapeHtml(cta.eyebrow)}</p>
          <h2 id="tool-cta-title" class="mt-3 text-3xl font-black tracking-tight">${escapeHtml(cta.title)}</h2>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-300">${escapeHtml(cta.body)}</p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a class="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950" href="/">${escapeHtml(cta.primaryLabel)}</a>
            ${secondary}
          </div>
          <p class="mt-4 text-xs leading-5 text-slate-400">Independent local static preflight only. This is not an official Chrome Web Store validation result.</p>
        </section>`
}

function renderSources(sources) {
  if (!sources || sources.length === 0) return ''
  return `

        <section class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="sources-title">
          <p class="text-sm font-bold uppercase tracking-widest text-slate-500">Official sources</p>
          <h2 id="sources-title" class="mt-3 text-3xl font-black tracking-tight">Sources used for this page</h2>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">These links are listed so scanner findings and page guidance can be checked against Chrome's source documentation. This site remains an independent preflight tool.</p>
          <div class="mt-6 grid gap-4 md:grid-cols-2">${sources.map((source) => `
            <a class="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100 hover:bg-slate-100" href="${escapeAttribute(source.url)}" rel="nofollow noopener noreferrer" target="_blank">
              <h3 class="font-bold text-slate-950">${escapeHtml(source.label)}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(source.note)}</p>
            </a>`).join('')}
          </div>
        </section>`
}

function renderPolicyFooter() {
  return `

        <footer class="border-t border-slate-200 pt-6 text-sm text-slate-600">
          <p>Chrome Extension Rejection Checker is an independent local preflight scanner. It is not affiliated with Google or Chrome Web Store and does not guarantee approval.</p>
          <nav class="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Site policy links">
            <a class="font-medium text-slate-700 hover:text-slate-950" href="/about">About</a>
            <a class="font-medium text-slate-700 hover:text-slate-950" href="/privacy">Privacy</a>
            <a class="font-medium text-slate-700 hover:text-slate-950" href="/terms">Terms</a>
            <a class="font-medium text-slate-700 hover:text-slate-950" href="/disclaimer">Disclaimer</a>
            <a class="font-medium text-slate-700 hover:text-slate-950" href="/contact">Contact</a>
          </nav>
        </footer>`
}

function renderStaticPage(page) {
  return `
    <main class="min-h-screen bg-slate-50 px-4 py-12 text-slate-950" data-static-seo-page="${escapeAttribute(page.path)}">
      <article class="mx-auto max-w-5xl space-y-8">
        <nav class="flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Guide navigation">
          <a class="font-semibold text-slate-700 hover:text-slate-950" href="/">Chrome Extension Rejection Checker</a>
          <a class="rounded-2xl bg-slate-950 px-4 py-2.5 font-semibold text-white" href="/">Run local ZIP scan</a>
        </nav>

        <section class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <p class="text-sm font-bold uppercase tracking-widest text-slate-500">${escapeHtml(page.eyebrow)}</p>
          <h1 class="mt-3 text-4xl font-black tracking-tight">${escapeHtml(page.title)}</h1>
          <p class="mt-4 max-w-3xl text-base leading-7 text-slate-600">${escapeHtml(page.description)}</p>
          <a class="mt-8 inline-block rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" href="/">Run local ZIP scan</a>
        </section>${renderToolCta(page.toolCta)}

        <section class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="guide-sections-title">
          <p class="text-sm font-bold uppercase tracking-widest text-slate-500">Guide</p>
          <h2 id="guide-sections-title" class="mt-3 text-3xl font-black tracking-tight">What to check</h2>
          <div class="mt-6 grid gap-5 md:grid-cols-3">${renderCardGrid(page.sections)}
          </div>
        </section>${renderPrivacyAdvertisingDisclosure(page)}${renderContentBlocks(page.contentBlocks)}

        <section class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="checklist-title">
          <p class="text-sm font-bold uppercase tracking-widest text-slate-500">Checklist</p>
          <h2 id="checklist-title" class="mt-3 text-3xl font-black tracking-tight">Action checklist</h2>
          <ul class="mt-6 space-y-3">${renderChecklist(page.checklist)}
          </ul>
        </section>

        <section class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="examples-title">
          <p class="text-sm font-bold uppercase tracking-widest text-slate-500">Examples</p>
          <h2 id="examples-title" class="mt-3 text-3xl font-black tracking-tight">Common cases this page helps with</h2>
          <div class="mt-6 grid gap-5 md:grid-cols-3">${renderCardGrid(page.examples)}
          </div>
        </section>

        <section class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="faq-title">
          <p class="text-sm font-bold uppercase tracking-widest text-slate-500">FAQ</p>
          <h2 id="faq-title" class="mt-3 text-3xl font-black tracking-tight">Frequently asked questions</h2>
          <div class="mt-6 space-y-4">${renderFaqs(page.faqs)}
          </div>
        </section>

        ${renderSources(page.sources)}

        <section class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="related-title">
          <p class="text-sm font-bold uppercase tracking-widest text-slate-500">Related guides</p>
          <h2 id="related-title" class="mt-3 text-3xl font-black tracking-tight">Continue review</h2>
          <div class="mt-6 flex flex-wrap gap-3">${renderRelatedLinks(page.relatedLinks)}
            <a class="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200" href="/">Run local ZIP scan</a>
          </div>
        </section>${renderPolicyFooter()}
      </article>
    </main>`
}

function replaceStaticBody(html, page) {
  const startMarker = '<!-- STATIC_ROOT_START -->'
  const endMarker = '<!-- STATIC_ROOT_END -->'
  const markerStart = html.indexOf(startMarker)
  const markerEnd = html.indexOf(endMarker)

  if (markerStart === -1 || markerEnd === -1 || markerEnd <= markerStart) {
    throw new Error('Could not find STATIC_ROOT_START / STATIC_ROOT_END markers in template HTML.')
  }

  const renderedPage = renderStaticPage(page)
  const contentStart = markerStart + startMarker.length
  return `${html.slice(0, contentStart)}\n${renderedPage}\n      ${html.slice(markerEnd)}`
}

function replaceMeta(html, page) {
  const canonical = `${siteUrl}${page.path}`
  const title = `${page.title} – Chrome Extension Rejection Checker`
  const escapedTitle = escapeAttribute(title)
  const escapedDescription = escapeAttribute(page.description)
  const escapedCanonical = escapeAttribute(canonical)

  let nextHtml = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapedTitle}</title>`)

  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bname="description")[^>]*>/,
    `<meta name="description" content="${escapedDescription}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<link\b(?=[^>]*\brel="canonical")[^>]*>/,
    `<link rel="canonical" href="${escapedCanonical}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty="og:url")[^>]*>/,
    `<meta property="og:url" content="${escapedCanonical}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty="og:title")[^>]*>/,
    `<meta property="og:title" content="${escapedTitle}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty="og:description")[^>]*>/,
    `<meta property="og:description" content="${escapedDescription}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bname="twitter:title")[^>]*>/,
    `<meta name="twitter:title" content="${escapedTitle}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bname="twitter:description")[^>]*>/,
    `<meta name="twitter:description" content="${escapedDescription}" />`,
  )

  return replaceJsonLd(nextHtml, page)
}

const templatePath = join(process.cwd(), 'dist', 'index.html')
const template = await readFile(templatePath, 'utf8')

for (const page of pages) {
  const outputPath = join(process.cwd(), 'dist', page.path, 'index.html')
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, replaceStaticBody(replaceMeta(template, page), page))
}

console.log(`Generated ${pages.length} static SEO pages with route-specific HTML bodies.`)
