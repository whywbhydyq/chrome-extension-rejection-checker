export function SeoContent() {
  return (
    <section className="mt-16 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Manifest V3 pre-submission checklist</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight">Check common Chrome Web Store rejection causes before you upload</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <article>
          <h3 className="font-bold">Remote hosted code</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Manifest V3 extensions should bundle executable JavaScript and WebAssembly inside the submitted package. The scanner looks for remote script tags, remote imports, importScripts calls, dynamic script loading, and remote WebAssembly execution paths.</p>
        </article>
        <article>
          <h3 className="font-bold">Dynamic code execution</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Patterns such as eval, new Function, and string-based timers are strong signals for CSP and review problems. The report points to the file, line, and snippet so you can replace them with bundled functions or modules.</p>
        </article>
        <article>
          <h3 className="font-bold">Packaging mistakes</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">A common submission mistake is zipping the parent project folder. Chrome Web Store expects manifest.json at the ZIP root. If the scanner finds a nested manifest, it reports a High packaging risk.</p>
        </article>
        <article>
          <h3 className="font-bold">Permissions and privacy review</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Permissions such as tabs, cookies, history, scripting, debugger, and broad host access may be valid, but they should be minimized and clearly justified in your listing and privacy disclosures.</p>
        </article>
      </div>
      <div className="mt-8 rounded-2xl bg-slate-50 p-5">
        <h3 className="font-bold">What this tool does not do</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">It does not upload your source code, log in to Chrome Web Store, scan Developer Dashboard fields, detect malware, or guarantee approval. It is a local static preflight checker designed to catch obvious issues early.</p>
      </div>
    </section>
  )
}
