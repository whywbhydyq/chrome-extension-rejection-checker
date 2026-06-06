import { useEffect } from 'react'
import type { SeoPageData } from './seoPages'

type SeoPageProps = {
  page: SeoPageData
}

const siteUrl = 'https://cws.ymirtool.com'
const defaultSocialImage = `${siteUrl}/og-image.png`

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}

function getPageCanonical(page: SeoPageData) {
  return `${siteUrl}${page.path}`
}

function getPageMetaTitle(page: SeoPageData) {
  return page.metaTitle ?? `${page.title} – Chrome Extension Rejection Checker`
}

function getPageType(page: SeoPageData) {
  return page.path === '/privacy' || page.path === '/guides' ? 'WebPage' : 'TechArticle'
}

function getGuideHubItems(page: SeoPageData) {
  if (page.path !== '/guides') return []
  return page.relatedLinks.map((link, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${siteUrl}${link.href}`,
    name: link.label,
  }))
}

function createStructuredData(page: SeoPageData) {
  const canonical = getPageCanonical(page)
  const pageType = getPageType(page)
  const pageEntity: Record<string, unknown> = {
    '@type': pageType,
    '@id': `${canonical}#${pageType === 'TechArticle' ? 'article' : 'webpage'}`,
    url: canonical,
    name: page.title,
    headline: page.title,
    description: page.description,
    inLanguage: 'en',
    isPartOf: {
      '@id': `${siteUrl}/#website`,
    },
    mainEntityOfPage: canonical,
    breadcrumb: {
      '@id': `${canonical}#breadcrumb`,
    },
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
  }

  if (page.lastUpdated) {
    pageEntity.datePublished = page.lastUpdated
    pageEntity.dateModified = page.lastUpdated
  }

  if (pageType === 'TechArticle') {
    pageEntity.author = {
      '@id': `${siteUrl}/#organization`,
    }
    pageEntity.about = [
      'Chrome extension review preparation',
      'Manifest V3 extension package validation',
      'Chrome Web Store rejection risk checks',
    ]
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      pageEntity,
      ...(page.path === '/guides'
        ? [{
          '@type': 'ItemList',
          '@id': `${canonical}#guide-list`,
          name: 'Manifest V3 Chrome Web Store review guides',
          itemListOrder: 'https://schema.org/ItemListOrderAscending',
          numberOfItems: getGuideHubItems(page).length,
          itemListElement: getGuideHubItems(page),
        }]
        : []),
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Chrome Extension Rejection Checker',
            item: `${siteUrl}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: page.title,
            item: canonical,
          },
        ],
      },
    ],
  }
}

function upsertJsonLd(id: string, data: unknown) {
  let element = document.getElementById(id) as HTMLScriptElement | null
  if (!element) {
    element = document.createElement('script')
    element.id = id
    element.type = 'application/ld+json'
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(data)
}

function upsertMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.appendChild(element)
  }
  element.content = content
}

function upsertPropertyMeta(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.content = content
}

function upsertCanonical(href: string) {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = href
}

function PrivacyAdvertisingDisclosure() {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="advertising-disclosure-title">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Advertising disclosure</p>
      <h2 id="advertising-disclosure-title" className="mt-3 text-3xl font-black tracking-tight">Google advertising cookies and choices</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <section className="rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold">Third-party advertising cookies</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This site may use Google AdSense. Third-party vendors, including Google, may use cookies to serve ads based on prior visits to this site or other websites.
          </p>
        </section>
        <section className="rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold">Personalized ads</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Google's advertising cookies enable Google and its partners to serve ads based on visits to this site and other sites on the Internet.
          </p>
        </section>
        <section className="rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold">Opt-out choices</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Users can opt out of personalized advertising in <a className="font-semibold underline" href="https://adssettings.google.com/" rel="nofollow">Google Ads Settings</a> or review broader choices through <a className="font-semibold underline" href="https://www.aboutads.info/choices/" rel="nofollow">AboutAds</a>.
          </p>
        </section>
      </div>
    </section>
  )
}



function ToolCtaCard({ cta }: { cta?: SeoPageData['toolCta'] }) {
  if (!cta) return null

  return (
    <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm md:p-8" aria-labelledby="tool-cta-title">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-300">{cta.eyebrow}</p>
      <h2 id="tool-cta-title" className="mt-3 text-3xl font-black tracking-tight">{cta.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{cta.body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950" href="/">
          {cta.primaryLabel}
        </a>
        {cta.secondaryLabel && cta.secondaryHref && (
          <a className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30" href={cta.secondaryHref}>
            {cta.secondaryLabel}
          </a>
        )}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-400">Independent local static preflight only. This is not an official Chrome Web Store validation result.</p>
    </section>
  )
}

function SourceList({ sources }: { sources?: SeoPageData['sources'] }) {
  if (!sources || sources.length === 0) return null

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="sources-title">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Official sources</p>
      <h2 id="sources-title" className="mt-3 text-3xl font-black tracking-tight">Sources used for this page</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        These links are listed so scanner findings and page guidance can be checked against Chrome's source documentation. This site remains an independent preflight tool.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <a key={source.url} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100 hover:bg-slate-100" href={source.url} rel="nofollow noopener noreferrer" target="_blank">
            <h3 className="font-bold text-slate-950">{source.label}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{source.note}</p>
          </a>
        ))}
      </div>
    </section>
  )
}


function ContentBlocks({ blocks }: { blocks?: SeoPageData['contentBlocks'] }) {
  if (!blocks || blocks.length === 0) return null

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="practical-notes-title">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Practical notes</p>
      <h2 id="practical-notes-title" className="mt-3 text-3xl font-black tracking-tight">How to apply this before resubmission</h2>
      <div className="mt-6 space-y-5">
        {blocks.map((block) => (
          <section key={block.heading} className="rounded-2xl bg-slate-50 p-5">
            <h3 className="font-bold text-slate-950">{block.heading}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{block.body}</p>
            {block.bullets && block.bullets.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                {block.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="font-bold text-slate-950">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
            {block.ctaLabel && block.ctaHref && (
              <a className="mt-4 inline-block text-sm font-semibold underline" href={block.ctaHref}>
                {block.ctaLabel}
              </a>
            )}
          </section>
        ))}
      </div>
    </section>
  )
}


function ReviewMethodCard({ page }: { page: SeoPageData }) {
  if (!page.reviewMethod) return null

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="review-method-title">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Review method</p>
      <h2 id="review-method-title" className="mt-3 text-3xl font-black tracking-tight">{page.reviewMethod.heading}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{page.reviewMethod.body}</p>
      <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
        {page.reviewMethod.checks.map((check) => (
          <li key={check} className="rounded-2xl bg-slate-50 p-4"><span className="font-bold text-slate-950">✓</span> {check}</li>
        ))}
      </ul>
    </section>
  )
}

function PolicyFooter() {
  return (
    <footer className="border-t border-slate-200 pt-6 text-sm text-slate-600">
      <p>
        Chrome Extension Rejection Checker is an independent local preflight scanner. It is not affiliated with Google or Chrome Web Store and does not guarantee approval.
      </p>
      <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Site policy links">
        <a className="font-medium text-slate-700 hover:text-slate-950" href="/guides">Guides</a>
        <a className="font-medium text-slate-700 hover:text-slate-950" href="/about">About</a>
        <a className="font-medium text-slate-700 hover:text-slate-950" href="/privacy">Privacy</a>
        <a className="font-medium text-slate-700 hover:text-slate-950" href="/terms">Terms</a>
        <a className="font-medium text-slate-700 hover:text-slate-950" href="/disclaimer">Disclaimer</a>
        <a className="font-medium text-slate-700 hover:text-slate-950" href="/contact">Contact</a>
      </nav>
    </footer>
  )
}

export function SeoPage({ page }: SeoPageProps) {
  useEffect(() => {
    const canonical = getPageCanonical(page)
    const title = getPageMetaTitle(page)
    document.title = title
    upsertMeta('description', page.description)
    upsertPropertyMeta('og:url', canonical)
    upsertPropertyMeta('og:title', title)
    upsertPropertyMeta('og:description', page.description)
    upsertPropertyMeta('og:image', defaultSocialImage)
    upsertPropertyMeta('og:image:width', '1200')
    upsertPropertyMeta('og:image:height', '630')
    upsertPropertyMeta('og:image:alt', 'Chrome Extension Rejection Checker local Manifest V3 ZIP scan')
    upsertMeta('twitter:title', title)
    upsertMeta('twitter:description', page.description)
    upsertMeta('twitter:image', defaultSocialImage)
    upsertMeta('twitter:image:alt', 'Chrome Extension Rejection Checker local Manifest V3 ZIP scan')
    upsertCanonical(canonical)
    upsertJsonLd('structured-data', createStructuredData(page))
  }, [page])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <article className="mx-auto max-w-5xl space-y-8">
        <nav className="flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Guide navigation">
          <a className="font-semibold text-slate-700 hover:text-slate-950" href="/">
            Chrome Extension Rejection Checker
          </a>
          <a className="rounded-2xl bg-slate-950 px-4 py-2.5 font-semibold text-white" href="/">
            Run local ZIP scan
          </a>
        </nav>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{page.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">{page.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{page.description}</p>
          {page.lastUpdated && (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Last updated: <time dateTime={page.lastUpdated}>{formatDate(page.lastUpdated)}</time> · Independent preflight guidance based on public Chrome documentation and local scanner rules.
            </p>
          )}
          <a className="mt-8 inline-block rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" href="/">
            Run local ZIP scan
          </a>
        </section>

        <ToolCtaCard cta={page.toolCta} />

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="guide-sections-title">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Guide</p>
          <h2 id="guide-sections-title" className="mt-3 text-3xl font-black tracking-tight">What to check</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {page.sections.map((section) => (
              <section key={section.heading} className="rounded-2xl bg-slate-50 p-5">
                <h3 className="font-bold">{section.heading}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
              </section>
            ))}
          </div>
        </section>

        {page.path === '/privacy' && <PrivacyAdvertisingDisclosure />}

        <ContentBlocks blocks={page.contentBlocks} />

        <ReviewMethodCard page={page} />

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="checklist-title">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Checklist</p>
          <h2 id="checklist-title" className="mt-3 text-3xl font-black tracking-tight">Action checklist</h2>
          <ul className="mt-6 space-y-3">
            {page.checklist.map((item) => (
              <li key={item} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <span className="font-bold text-slate-950">□</span> {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="examples-title">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Examples</p>
          <h2 id="examples-title" className="mt-3 text-3xl font-black tracking-tight">Common cases this page helps with</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {page.examples.map((example) => (
              <section key={example.title} className="rounded-2xl bg-slate-50 p-5">
                <h3 className="font-bold">{example.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{example.body}</p>
              </section>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="faq-title">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">FAQ</p>
          <h2 id="faq-title" className="mt-3 text-3xl font-black tracking-tight">Frequently asked questions</h2>
          <div className="mt-6 space-y-4">
            {page.faqs.map((faq) => (
              <section key={faq.question} className="rounded-2xl bg-slate-50 p-5">
                <h3 className="font-bold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </section>
            ))}
          </div>
        </section>

        <SourceList sources={page.sources} />

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="related-title">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Related guides</p>
          <h2 id="related-title" className="mt-3 text-3xl font-black tracking-tight">Continue review</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {page.relatedLinks.map((link) => (
              <a key={link.href} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" href={link.href}>
                {link.label}
              </a>
            ))}
            <a className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200" href="/">
              Run local ZIP scan
            </a>
          </div>
        </section>

        <PolicyFooter />
      </article>
    </main>
  )
}
