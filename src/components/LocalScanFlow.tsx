const flowSteps = [
  {
    step: '1',
    title: 'Select the final ZIP',
    body: 'Use the same packaged extension ZIP you plan to upload to Chrome Web Store, with manifest.json at the package root.',
  },
  {
    step: '2',
    title: 'Read files in your browser',
    body: 'The File API and ZIP reader inspect manifest, HTML, worker, script, icon, and package metadata locally without sending source files to a server.',
  },
  {
    step: '3',
    title: 'Map findings to review risks',
    body: 'Static rules classify remote hosted code, dynamic execution, CSP, permissions, missing references, and privacy-review reminders by severity.',
  },
  {
    step: '4',
    title: 'Follow the fix path',
    body: 'The report links high-priority findings to the matching repair guide so you can rebuild the ZIP and scan the final package again.',
  },
]

const privacySignals = [
  'ZIP contents stay in the selected browser session',
  'No source code, manifest text, snippets, file names, or detected URLs are sent to analytics',
  'Only aggregate events such as finding count, severity count, and guide clicks may be measured',
]

export function LocalScanFlow() {
  return (
    <section className="mt-8 rounded-3xl bg-slate-950 p-6 text-white shadow-sm md:p-8" aria-labelledby="local-flow-title">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Visual privacy proof</p>
          <h2 id="local-flow-title" className="mt-3 text-3xl font-black tracking-tight">Your extension package is checked in this browser</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            The scanner is intentionally designed as a local preflight workflow: choose the production ZIP, inspect package files in the browser, classify static review risks, then follow the matching fix guide before resubmission.
          </p>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-300" aria-label="Local scan privacy signals">
            {privacySignals.map((signal) => (
              <li key={signal} className="flex gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <span aria-hidden="true" className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-slate-950">✓</span>
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>

        <ol className="grid gap-3 sm:grid-cols-2" aria-label="Local scan flow">
          {flowSteps.map((step) => (
            <li key={step.step} className="rounded-2xl bg-white p-5 text-slate-950 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white ring-4 ring-slate-100">{step.step}</span>
                <h3 className="font-bold">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
