import { trackEvent } from '../core/analytics'
import { guideForFinding } from '../core/guideLinks'
import type { ScanReport } from '../core/types'

type FindingListProps = {
  report: ScanReport
}

function handleGuideClick(ruleId: string, severity: string, href: string) {
  trackEvent('finding_guide_click', {
    rule_id: ruleId,
    severity,
    target_path: href,
  })
}

export function FindingList({ report }: FindingListProps) {
  const severityOrder: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low']
  const severityLabels: Record<'high' | 'medium' | 'low', string> = { high: 'High', medium: 'Medium', low: 'Low' }

  if (!report.findings.length) return null

  return (
    <div className="space-y-8">
      {severityOrder.map((severity) => {
        const findings = report.findings.filter((finding) => finding.severity === severity)
        if (!findings.length) return null
        return (
          <section key={severity} className="space-y-4">
            <div>
              <h2 className="text-xl font-black">{severityLabels[severity]} findings</h2>
              <p className="mt-1 text-sm text-slate-600">{findings.length} item{findings.length === 1 ? '' : 's'} found.</p>
            </div>
            {findings.map((finding, index) => {
              const guide = guideForFinding(finding)
              return (
                <article key={`${finding.ruleId}-${finding.file ?? 'global'}-${index}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{finding.severity} · {finding.ruleId}</p>
                  <h3 className="mt-1 font-semibold">{finding.title}</h3>
                  {finding.file && <p className="mt-2 text-sm"><strong>File:</strong> <code>{finding.file}</code>{finding.line ? ` line ${finding.line}` : ''}</p>}
                  {finding.snippet && <pre className="mt-3 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">{finding.snippet}</pre>}
                  <p className="mt-3 text-sm"><strong>Reason:</strong> {finding.reason}</p>
                  {finding.confidence && <p className="mt-2 text-sm"><strong>Confidence:</strong> {finding.confidence}</p>}
                  <p className="mt-2 text-sm"><strong>Fix:</strong> {finding.recommendation}</p>
                  {guide && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-100">
                      <p className="font-semibold text-slate-950">Next step</p>
                      <p className="mt-1 leading-6 text-slate-600">{guide.note}</p>
                      <a
                        className="mt-3 inline-block rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
                        href={guide.href}
                        onClick={() => handleGuideClick(finding.ruleId, finding.severity, guide.href)}
                      >
                        {guide.label}
                      </a>
                    </div>
                  )}
                  {finding.sourceUrl && <a className="mt-3 inline-block text-sm font-semibold underline" href={finding.sourceUrl} target="_blank" rel="noreferrer">Official reference</a>}
                </article>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
