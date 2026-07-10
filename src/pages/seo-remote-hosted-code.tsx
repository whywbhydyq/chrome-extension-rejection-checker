import { HeroSection } from '../components/HeroSection'

export default function SeoRemoteHostedCode(){
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <HeroSection />
        <article className="mt-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-black">Remote hosted code in Chrome extensions</h1>
          <p className="mt-4 text-sm text-slate-600">Manifest V3 extensions should bundle executable JavaScript and WebAssembly inside the zip package. Remote scripts, dynamic importScripts, and remote WASM paths may cause rejection.</p>
        </article>
      </section>
    </main>
  )
}
