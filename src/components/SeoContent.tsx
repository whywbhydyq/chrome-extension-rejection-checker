const relatedGuides = [
  {
    href: '/chrome-web-store-rejection-checker',
    title: 'Chrome Web Store rejection checker',
    description: 'Use the local scanner after a vague rejection email or before uploading a new release ZIP.',
  },
  {
    href: '/manifest-v3-pre-submission-checklist',
    title: 'Manifest V3 pre-submission checklist',
    description: 'Review manifest.json, ZIP packaging, referenced files, permissions, CSP, and listing disclosures.',
  },
  {
    href: '/fix-remote-hosted-code-manifest-v3',
    title: 'Fix remote hosted code in Manifest V3',
    description: 'Find and replace remote script, importScripts, dynamic import, and WebAssembly execution risks.',
  },
  {
    href: '/blue-argon-chrome-extension-error',
    title: 'Fix Blue Argon rejection errors',
    description: 'Use the rejected ZIP to find remote hosted code patterns commonly associated with Blue Argon emails.',
  },
  {
    href: '/chrome-extension-eval-rejection-fix',
    title: 'Fix eval and dynamic code rejection',
    description: 'Replace eval, Function constructors, and string-based timers with bundled functions or modules.',
  },
  {
    href: '/chrome-extension-host-permissions-privacy-review',
    title: 'Host permissions and privacy review checklist',
    description: 'Minimize broad host permissions and prepare clear Chrome Web Store privacy disclosures.',
  },
  {
    href: '/privacy',
    title: 'Privacy notes for local ZIP scanning',
    description: 'Understand what the scanner reads locally and which analytics data should never be collected.',
  },
  {
    href: '/how-it-works',
    title: 'How the scanner works',
    description: 'Review the static rules, severity model, limits, and recommended resubmission workflow.',
  },
]

const faqs = [
  {
    question: 'Does this Chrome extension rejection checker upload my ZIP?',
    answer: 'No. The scan runs locally in your browser. Your Chrome extension ZIP is read on your device to inspect manifest.json, referenced files, JavaScript, HTML, CSP, permissions, icons, and review signals. The tool does not upload your source code.',
  },
  {
    question: 'Can this tool guarantee Chrome Web Store approval?',
    answer: 'No. This is a static preflight scanner, not an official Chrome Web Store validator. It can catch common issues early, but Google review can also include listing metadata, privacy fields, manual review, and runtime behavior.',
  },
  {
    question: 'What rejection risks does it check?',
    answer: 'It checks missing or invalid manifest.json, Manifest V3 packaging mistakes, missing manifest references including sandbox pages, remote hosted code, eval and legacy dynamic code execution, unsafe CSP, broad host permissions, sensitive Chrome API permissions, icon paths, skipped-file limits, and privacy review reminders.',
  },
  {
    question: 'What is remotely hosted code in Manifest V3?',
    answer: 'Remote hosted code generally means executable JavaScript or WebAssembly loaded from outside the submitted extension package. The scanner flags remote script paths and related execution patterns so you can bundle executable code into the ZIP.',
  },
  {
    question: 'What does a Blue Argon rejection usually mean?',
    answer: 'Blue Argon is commonly associated with remotely hosted code. Scan the exact rejected ZIP and inspect every remote script, dynamic import, importScripts call, WebAssembly fetch path, and generated dependency bundle.',
  },
  {
    question: 'Why does the scanner flag broad host permissions?',
    answer: 'Broad host permissions may be legitimate, but they can increase Chrome Web Store review scrutiny and user warning impact. The report asks you to confirm whether the scope can be narrowed or moved to optional permissions.',
  },
  {
    question: 'What should I do after a high-risk finding?',
    answer: 'Fix high-risk findings first, rebuild the production ZIP, then scan the rebuilt ZIP again. Chrome Web Store reviews the submitted package, so check the final ZIP rather than only your source folder.',
  },
]

export function SeoContent() {
  return (
    <div className="space-y-8">
      <section className="mt-16 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Manifest V3 pre-submission checklist</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">Check common Chrome Web Store rejection causes before you upload</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          This local scanner is designed for developers who need a fast preflight check before Chrome Web Store submission.
          It focuses on static package problems that are easy to miss in a production ZIP: nested manifests, missing files,
          remote executable code, dynamic string-code execution, broad permissions, and privacy review reminders.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <article>
            <h3 className="font-bold">Remote hosted code</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Manifest V3 extensions should bundle executable JavaScript and WebAssembly inside the submitted package. The scanner looks for remote script tags, remote imports, importScripts calls, dynamic script loading, and remote WebAssembly execution paths.</p>
            <a className="mt-3 inline-block text-sm font-semibold underline" href="/fix-remote-hosted-code-manifest-v3">Fix remote hosted code in Manifest V3</a>
          </article>
          <article>
            <h3 className="font-bold">Blue Argon rejection</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">If a Chrome Web Store rejection mentions Blue Argon, scan the rejected ZIP and check every bundled HTML, worker, script, generated dependency, and WebAssembly loader for remote executable code.</p>
            <a className="mt-3 inline-block text-sm font-semibold underline" href="/blue-argon-chrome-extension-error">Fix Blue Argon rejection errors</a>
          </article>
          <article>
            <h3 className="font-bold">Dynamic code execution</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Patterns such as eval, new Function, string-based timers, legacy tabs.executeScript code strings, and DevTools inspectedWindow.eval are strong signals for CSP and review problems. The report points to the file, line, and snippet so you can replace them with bundled functions or modules.</p>
            <a className="mt-3 inline-block text-sm font-semibold underline" href="/chrome-extension-eval-rejection-fix">Fix eval and dynamic code rejection</a>
          </article>
          <article>
            <h3 className="font-bold">Packaging mistakes</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">A common submission mistake is zipping the parent project folder. Chrome Web Store expects manifest.json at the ZIP root. If the scanner finds a nested manifest, it reports a High packaging risk.</p>
            <a className="mt-3 inline-block text-sm font-semibold underline" href="/manifest-v3-pre-submission-checklist">Open the Manifest V3 checklist</a>
          </article>
          <article>
            <h3 className="font-bold">Permissions and privacy review</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Permissions such as tabs, cookies, history, scripting, debugger, and broad host access may be valid, but they should be minimized and clearly justified in your listing and privacy disclosures.</p>
            <a className="mt-3 inline-block text-sm font-semibold underline" href="/chrome-extension-host-permissions-privacy-review">Review permissions and privacy signals</a>
          </article>
          <article>
            <h3 className="font-bold">Privacy and scanner limits</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">The scanner reads the selected ZIP locally and should not send source code, manifest content, snippets, file names, file paths, detected URLs, or skipped-file details to analytics. It is a static preflight check, not an official approval result.</p>
            <a className="mt-3 inline-block text-sm font-semibold underline" href="/privacy">Read privacy notes</a>
          </article>
        </div>
        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold">Privacy and limits</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">This tool does not upload your source code, log in to Chrome Web Store, scan Developer Dashboard fields, detect malware, or guarantee approval. It is a local static preflight checker designed to catch obvious issues early.</p>
          <a className="mt-3 inline-block text-sm font-semibold underline" href="/how-it-works">See how the scanner works</a>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="related-guides-title">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Related Chrome extension review guides</p>
        <h2 id="related-guides-title" className="mt-3 text-3xl font-black tracking-tight">Use these guides after your scan</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {relatedGuides.map((guide) => (
            <a key={guide.href} href={guide.href} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100 hover:bg-slate-100">
              <h3 className="font-bold text-slate-950">{guide.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{guide.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section id="faq" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" aria-labelledby="faq-title">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">FAQ</p>
        <h2 id="faq-title" className="mt-3 text-3xl font-black tracking-tight">Chrome extension rejection checker FAQ</h2>
        <div className="mt-6 space-y-5">
          {faqs.map((faq) => (
            <section key={faq.question} className="rounded-2xl bg-slate-50 p-5">
              <h3 className="font-bold">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
