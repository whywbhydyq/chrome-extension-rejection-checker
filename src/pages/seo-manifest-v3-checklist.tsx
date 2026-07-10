import { HeroSection } from '../components/HeroSection'
import { SeoContent } from '../components/SeoContent'

export default function SeoManifestV3Checklist(){
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <HeroSection />
        <SeoContent />
        <article className="mt-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-black">Manifest V3 pre submission checklist</h1>
          <p className="mt-4 text-sm text-slate-600">Ensure all required manifest fields are present, manifest.json is at the ZIP root, and all referenced files exist.</p>
        </article>
      </section>
    </main>
  )
}
