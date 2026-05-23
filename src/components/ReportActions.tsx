import { useState } from 'react'
import type { ScanReport } from '../core/types'
import { downloadJson, toFixChecklist, toMarkdownReport } from '../core/report'

type ReportActionsProps = {
  report: ScanReport
  copied: boolean
  onCopied: () => void
}

export function ReportActions({ report, copied, onCopied }: ReportActionsProps) {
  const [checklistCopied, setChecklistCopied] = useState(false)

  async function copyReport() {
    await navigator.clipboard.writeText(toMarkdownReport(report))
    onCopied()
  }

  async function copyChecklist() {
    await navigator.clipboard.writeText(toFixChecklist(report))
    setChecklistCopied(true)
    window.setTimeout(() => setChecklistCopied(false), 1800)
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={copyReport}>
        {copied ? 'Copied Markdown' : 'Copy Markdown'}
      </button>
      <button className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200" type="button" onClick={copyChecklist}>
        {checklistCopied ? 'Copied checklist' : 'Copy fix checklist'}
      </button>
      <button className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200" type="button" onClick={() => downloadJson(report)}>
        Download JSON
      </button>
    </div>
  )
}
