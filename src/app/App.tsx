import { useState } from 'react'
import { scanContext } from '../core/ruleEngine'
import type { ScanReport } from '../core/types'
import { readExtensionZip } from '../core/zipReader'
import { toMarkdownReport, downloadJson } from '../core/report'

function resultTitle(report: ScanReport): string {
  if (report.summary.high > 0) return 'High-risk findings detected'
  if (report.summary.medium > 0) return 'Review recommended'
  if (report.summary.low > 0) return 'Manual review notes found'
  return 'No findings detected'
}

function SeverityGuide() {
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

function SeoContent() {
  return (
    <section className="mt-16 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Manifest V3 pre-submission checklist</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight">Check common Chrome Web Store rejection causes before you upload</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <article>
          <h3 className="font-bold">Remote hosted code</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Manifest V3 extensions should bundle executable JavaScript and WebAssembly inside the submitted package. The scanner looks for remote script tags, remote imports, importScripts calls, and remote WebAssembly execution paths.</p>
        </article>
        <article>
          <h3 className="font-bold">Dynamic code execution</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Patterns such as eval, new Function, and string-based timers are strong signals for CSP and review problems. The report points to the file, line, and snippet so you can replace them with bundled functions or modules.</p>
        </article>
        <article>
          <h3 className="font-bold">Packaging mistakes</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">A very common submission mistake is zipping the parent project folder. Chrome Web Store expects manifest.json at the ZIP root. If the scanner finds a nested manifest, it reports a High packaging risk.</p>
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

export function App() {
  const [report, setReport] = useState<ScanReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [copied, setCopied] = useState(false)

  async function scan(file: File) {
    setScanning(true)
    setError(null)
    setCopied(false)
    try {
      const context = await readExtensionZip(file)
      setReport(scanContext(context))
    } catch (err) {
      setReport(null)
      setError(err instanceof Error ? err.message : 'Could not scan this zip.')
    } finally {
      setScanning(false)
    }
  }

  async function copyReport() {
    if (!report) return
    await navigator.clipboard.writeText(toMarkdownReport(report))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Free local scanner</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Free Local Chrome Web Store Rejection Checker</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Scan your Chrome extension ZIP for common Manifest V3 rejection risks before submitting.
            <strong className="text-slate-950"> Runs locally. Your extension never leaves your browser.</strong>
          </p>
          <p className="mt-3 text-sm text-slate-500">Static preflight scan only. Not an official Chrome Web Store validator.</p>
        </div>

        <label
          className="mx-auto mt-10 flex max-w-3xl cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center shadow-sm hover:border-slate-500"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const file = event.dataTransfer.files.item(0)
            if (file) void scan(file)
          }}
        >
          <span className="text-xl font-semibold">Drop your extension .zip here</span>
          <span className="mt-2 text-sm text-slate-600">No upload. No signup. Static preflight scan only.</span>
          <input
            className="hidden"
            type="file"
            accept=".zip,application/zip"
            disabled={scanning}
            onChange={(event) => {
              const file = event.currentTarget.files?.item(0)
              if (file) void scan(file)
              event.currentTarget.value = ''
            }}
          />
        </label>

        <div className="mx-auto mt-5 max-w-3xl rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
          Packaging tip: when submitting to Chrome Web Store, zip the files inside your extension folder so manifest.json is at the ZIP root.
        </div>

        {scanning && <p className="mt-4 text-center text-sm text-slate-600">Scanning locally…</p>}
        {error && <p className="mx-auto mt-4 max-w-3xl rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

        {report && (
          <section className="mt-10 space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-bold">{resultTitle(report)}</h2>
              <p className="mt-2 text-sm text-slate-600">{report.zipName} · manifest: {report.manifestPath ?? 'not found'}</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center sm:max-w-md">
                <div className="rounded-2xl bg-red-50 p-4"><div className="text-2xl font-black text-red-700">{report.summary.high}</div><div className="text-xs font-bold text-red-800">High</div></div>
                <div className="rounded-2xl bg-amber-50 p-4"><div className="text-2xl font-black text-amber-700">{report.summary.medium}</div><div className="text-xs font-bold text-amber-800">Medium</div></div>
                <div className="rounded-2xl bg-slate-100 p-4"><div className="text-2xl font-black text-slate-700">{report.summary.low}</div><div className="text-xs font-bold text-slate-700">Low</div></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={copyReport}>{copied ? 'Copied' : 'Copy Markdown'}</button>
                <button className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200" type="button" onClick={() => downloadJson(report)}>Download JSON</button>
              </div>
            </div>

            {report.findings.length === 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h3 className="font-semibold">No static findings in this scan</h3>
                <p className="mt-2 text-sm text-slate-600">Still review the manual checklist before submitting. This tool is not an official validator.</p>
              </div>
            )}

            {report.findings.map((finding, index) => (
              <article key={`${finding.ruleId}-${index}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{finding.severity} · {finding.ruleId}</p>
                <h3 className="mt-1 font-semibold">{finding.title}</h3>
                {finding.file && <p className="mt-2 text-sm"><strong>File:</strong> <code>{finding.file}</code>{finding.line ? ` line ${finding.line}` : ''}</p>}
                {finding.snippet && <pre className="mt-3 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">{finding.snippet}</pre>}
                <p className="mt-3 text-sm"><strong>Reason:</strong> {finding.reason}</p>
                <p className="mt-2 text-sm"><strong>Fix:</strong> {finding.recommendation}</p>
                {finding.sourceUrl && <a className="mt-3 inline-block text-sm font-semibold underline" href={finding.sourceUrl} target="_blank" rel="noreferrer">Official reference</a>}
              </article>
            ))}

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold">Manual checklist</h2>
              <p className="mt-2 text-sm text-slate-600">These items cannot be verified from the ZIP alone.</p>
              <ul className="mt-4 space-y-3">
                {report.manualChecklist.map((item) => (
                  <li key={item.title} className="rounded-2xl bg-slate-50 p-4">
                    <strong>{item.title}</strong>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <SeverityGuide />
        <SeoContent />
      </section>
    </main>
  )
}
