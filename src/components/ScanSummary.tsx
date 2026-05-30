import type { ScanReport } from '../core/types'
import { ReportActions } from './ReportActions'
import { ResultExplanation } from './ResultExplanation'

type ScanSummaryProps = {
  report: ScanReport
  copied: boolean
  onCopied: () => void
}

function resultTitle(report: ScanReport): string {
  if (report.summary.high > 0) return 'High-risk findings detected'
  if (report.summary.medium > 0) return 'Review recommended'
  if (report.summary.low > 0) return 'Manual review notes found'
  return 'No findings detected'
}

export function ScanSummary({ report, copied, onCopied }: ScanSummaryProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-bold">{resultTitle(report)}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {report.zipName} · manifest: {report.manifestPath ?? 'not found'} · rules: {report.rulesVersion}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center sm:max-w-md">
          <div className="rounded-2xl bg-red-50 p-4"><div className="text-2xl font-black text-red-700">{report.summary.high}</div><div className="text-xs font-bold text-red-800">High</div></div>
          <div className="rounded-2xl bg-amber-50 p-4"><div className="text-2xl font-black text-amber-700">{report.summary.medium}</div><div className="text-xs font-bold text-amber-800">Medium</div></div>
          <div className="rounded-2xl bg-slate-100 p-4"><div className="text-2xl font-black text-slate-700">{report.summary.low}</div><div className="text-xs font-bold text-slate-700">Low</div></div>
        </div>
        {report.scanLimits.length > 0 && (
          <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
            Partial scan notice: {report.scanLimits.length} file safety limit {report.scanLimits.length === 1 ? 'note was' : 'notes were'} added. Review skipped or unread files manually before submission.
          </div>
        )}
        <ReportActions report={report} copied={copied} onCopied={onCopied} />
      </div>
      <ResultExplanation report={report} />
    </div>
  )
}
