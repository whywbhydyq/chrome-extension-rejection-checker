import type { ScanReport, Finding } from '../core/types'

type FindingListProps = {
  report: ScanReport
}

export function FindingList({ report }: FindingListProps) {
  const severityOrder: Array<'high'|'medium'|'low'> = ['high','medium','low']
  const severityLabels: Record<'high'|'medium'|'low', string> = { high:'High', medium:'Medium', low:'Low' }

  if (!report.findings.length) return null

  return (
    <div className="space-y-8">
      {severityOrder.map((severity) => {
        const findings = report.findings.filter((f) => f.severity === severity)
        if (!findings.length) return null
        return (
          <section key={severity} className="space-y-4">
            <div>
              <h2 className="text-xl font-black">{severityLabels[severity]} findings</h2>
              <p className="mt-1 text-sm text-slate-600">{findings.length} item{findings.length===1?'':'s'} found.</p>
            </div>
            {findings.map((finding,index)=>(
              <article key={`${finding.ruleId}-${finding.file??'global'}-${index}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{finding.severity} · {finding.ruleId}</p>
                <h3 className="mt-1 font-semibold">{finding.title}</h3>
                {finding.file && <p className="mt-2 text-sm"><strong>File:</strong> <code>{finding.file}</code>{finding.line?` line ${finding.line}`:''}</p>}
                {finding.snippet && <pre className="mt-3 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">{finding.snippet}</pre>}
                <p className="mt-3 text-sm"><strong>Reason:</strong> {finding.reason}</p>
                <p className="mt-2 text-sm"><strong>Fix:</strong> {finding.recommendation}</p>
                {finding.sourceUrl && <a className="mt-3 inline-block text-sm font-semibold underline" href={finding.sourceUrl} target="_blank" rel="noreferrer">Official reference</a>}
              </article>
            ))}
          </section>
        )
      })}
    </div>
  )
}
