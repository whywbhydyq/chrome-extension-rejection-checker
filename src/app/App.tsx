import { useState } from 'react'
import { scanContext } from '../core/ruleEngine'
import type { ScanReport } from '../core/types'
import { readExtensionZip } from '../core/zipReader'
import { toMarkdownReport, downloadJson } from '../core/report'

export function App() {
  const [report, setReport] = useState<ScanReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  async function scan(file: File) {
    setScanning(true)
    setError(null)
    try {
      const context = await readExtensionZip(file)
      setReport(scanContext(context))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not scan this zip.')
    } finally {
      setScanning(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Free local scanner</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Chrome Web Store Rejection Checker</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Scan your Chrome extension ZIP for common Manifest V3 rejection risks before submitting.
            <strong className="text-slate-950"> Runs locally. Your extension never leaves your browser.</strong>
          </p>
          <p className="mt-3 text-sm text-slate-500">Static preflight scan only. Not an official Chrome Web Store validator.</p>
        </div>

        <label className="mx-auto mt-10 flex max-w-3xl cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center shadow-sm hover:border-slate-500">
          <span className="text-xl font-semibold">Drop your extension .zip here</span>
          <span className="mt-2 text-sm text-slate-600">No upload. No signup. Static preflight scan only.</span>
          <input className="hidden" type="file" accept=".zip,application/zip" disabled={scanning} onChange={(event) => {
            const file = event.currentTarget.files?.item(0)
            if (file) void scan(file)
            event.currentTarget.value = ''
          }} />
        </label>

        {scanning && <p className="mt-4 text-center text-sm text-slate-600">Scanning locally…</p>}
        {error && <p className="mx-auto mt-4 max-w-3xl rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

        {report && (
          <section className="mt-10 space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-bold">Report</h2>
              <p className="mt-2 text-sm text-slate-600">{report.zipName} · manifest: {report.manifestPath ?? 'not found'}</p>
              <p className="mt-4 text-lg font-semibold">{report.summary.high} High · {report.summary.medium} Medium · {report.summary.low} Low</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={() => navigator.clipboard.writeText(toMarkdownReport(report))}>Copy Markdown</button>
                <button className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200" type="button" onClick={() => downloadJson(report)}>Download JSON</button>
              </div>
            </div>

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
          </section>
        )}
      </section>
    </main>
  )
}
