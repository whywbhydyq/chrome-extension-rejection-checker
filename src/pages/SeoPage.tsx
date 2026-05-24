import { useEffect } from 'react'
import type { SeoPageData } from './seoPages'

type SeoPageProps = {
  page: SeoPageData
}

const siteUrl = 'https://cws.ymirtool.com'

function upsertMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.name = name
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

export function SeoPage({ page }: SeoPageProps) {
  useEffect(() => {
    const canonical = `${siteUrl}${page.path}`
    document.title = `${page.title} – Chrome Extension Rejection Checker`
    upsertMeta('description', page.description)
    upsertCanonical(canonical)
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
          <a className="mt-8 inline-block rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" href="/">
            Run local ZIP scan
          </a>
        </section>

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
      </article>
    </main>
  )
}
