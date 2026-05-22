import { HeroSection } from '../components/HeroSection'
import type { SeoPageData } from './seoPages'

type SeoPageProps = {
  page: SeoPageData
}

export function SeoPage({ page }: SeoPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <HeroSection />
        <article className="mt-12 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{page.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">{page.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{page.description}</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {page.sections.map((section) => (
              <section key={section.heading} className="rounded-2xl bg-slate-50 p-5">
                <h2 className="font-bold">{section.heading}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
              </section>
            ))}
          </div>
          <a className="mt-8 inline-block rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" href="/">
            Run local ZIP scan
          </a>
        </article>
      </section>
    </main>
  )
}
