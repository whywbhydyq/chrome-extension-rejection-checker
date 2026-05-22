export function HeroSection() {
  return (
    <div className="text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Free local scanner</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Free Local Chrome Web Store Rejection Checker</h1>
      <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
        Scan your Chrome extension ZIP for common Manifest V3 rejection risks before submitting.
        <strong className="text-slate-950"> Runs locally. Your extension never leaves your browser.</strong>
      </p>
      <p className="mt-3 text-sm text-slate-500">Static preflight scan only. Not an official Chrome Web Store validator.</p>
    </div>
  )
}
