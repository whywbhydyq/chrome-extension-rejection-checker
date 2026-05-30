export function HeroSection() {
  return (
    <div className="mx-auto max-w-5xl text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Free local Manifest V3 ZIP scanner</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
        Scan your MV3 extension ZIP before Chrome Web Store submission
      </h1>
      <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
        Check the final package for remote hosted code, dynamic execution, CSP, permissions, missing files, and privacy review reminders. <strong className="text-slate-950">Your ZIP is not uploaded.</strong>
      </p>
      <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-2 text-sm font-semibold text-slate-700">
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Local ZIP scan</span>
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">No source upload</span>
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Independent tool</span>
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Static preflight only</span>
      </div>
      <p className="mt-3 text-sm text-slate-500">
        Not affiliated with Google or Chrome Web Store. Not a guarantee of approval.
      </p>
    </div>
  )
}
