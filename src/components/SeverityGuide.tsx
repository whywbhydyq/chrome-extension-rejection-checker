export function SeverityGuide() {
  return (
    <section className="mt-12 grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">High: likely rejection risk</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Remote hosted executable code, dynamic string execution, invalid Manifest V3 setup, unsafe CSP, and missing manifest-referenced files are flagged as High.</p>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">Medium: review scrutiny</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Broad host permissions, sensitive Chrome APIs, privacy disclosure review, and missing icon declarations are review risks, not automatic rejection claims.</p>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">Low: manual review notes</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Remote URLs found in web resources are listed for manual review so you can confirm they are APIs, images, or data instead of executable code.</p>
      </div>
    </section>
  )
}
