import { defaultChecklistGuide, guideActionsForFindings } from '../core/guideLinks'
import type { ScanReport } from '../core/types'
import { trackEvent } from '../core/analytics'

type SuggestedFixPathProps = {
  report: ScanReport
}

function handleFixPathClick(href: string, source: string, ruleIds?: string[]) {
  trackEvent('fix_path_click', {
    target_path: href,
    source,
    rule_ids: ruleIds?.join(','),
  })
}

export function SuggestedFixPath({ report }: SuggestedFixPathProps) {
  const actions = guideActionsForFindings(report.findings)

  if (!report.findings.length) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200" aria-labelledby="suggested-fix-path-title">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Suggested fix path</p>
        <h2 id="suggested-fix-path-title" className="mt-1 text-xl font-black">Use the clean scan as a final manual review checkpoint</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The static rules did not detect covered rejection risks. Before submission, still verify runtime behavior, Chrome Web Store listing copy,
          privacy disclosures, screenshots, and reviewer instructions.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            href={defaultChecklistGuide.href}
            onClick={() => handleFixPathClick(defaultChecklistGuide.href, 'clean_scan')}
          >
            {defaultChecklistGuide.label}
          </a>
          <a
            className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200"
            href="/chrome-extension-host-permissions-privacy-review"
            onClick={() => handleFixPathClick('/chrome-extension-host-permissions-privacy-review', 'clean_scan')}
          >
            Review privacy disclosures
          </a>
        </div>
      </section>
    )
  }

  if (!actions.length) return null

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200" aria-labelledby="suggested-fix-path-title">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Suggested fix path</p>
      <h2 id="suggested-fix-path-title" className="mt-1 text-xl font-black">Start with the guide that matches your scan findings</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        These links turn the static findings into a repair sequence. Fix high-risk items first, rebuild the production ZIP, scan again, then complete the manual checklist.
      </p>
      <ol className="mt-5 space-y-3">
        {actions.map((action, index) => (
          <li key={action.href} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Step {index + 1} · {action.prioritySeverity} priority · {action.total} finding{action.total === 1 ? '' : 's'}
                </p>
                <h3 className="mt-1 font-semibold text-slate-950">{action.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{action.note}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">Matched rules: {action.ruleIds.sort().join(', ')}</p>
              </div>
              <a
                className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white"
                href={action.href}
                onClick={() => handleFixPathClick(action.href, 'scan_results', action.ruleIds)}
              >
                Open guide
              </a>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
