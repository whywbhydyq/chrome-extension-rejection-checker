import type { ScanReport } from '../core/types'
import { downloadJson, toMarkdownReport } from '../core/report'

type ReportActionsProps = {
  report: ScanReport
  copied: boolean
  onCopied: () => void
}

export function ReportActions({ report, copied, onCopied }: ReportActionsProps) {
  async function copyReport() {
    await navigator.clipboard.writeText(toMarkdownReport(report))
    onCopied()
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={copyReport}>
        {copied ? 'Copied' : 'Copy Markdown'}
      </button>
      <button className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200" type="button" onClick={() => downloadJson(report)}>
        Download JSON
      </button>
    </div>
  )
}
