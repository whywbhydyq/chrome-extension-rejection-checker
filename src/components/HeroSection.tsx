export function HeroSection() {
  return (
    <div className="text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Free local Manifest V3 scanner</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
        Chrome Extension Rejection Checker for Manifest V3 ZIPs
      </h1>
      <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
        Scan your extension package in your browser before submitting to the Chrome Web Store. Detect common rejection risks such as remote hosted code, eval, missing manifest references, broad permissions, CSP issues, and privacy review reminders.
        <strong className="text-slate-950"> Your ZIP is not uploaded.</strong>
      </p>
      <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-sm font-semibold text-slate-700">
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">No upload</span>
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">No signup</span>
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Runs in your browser</span>
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Static preflight scan</span>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Not an official Chrome Web Store validator and not a guarantee of approval.
      </p>
    </div>
  )
}
