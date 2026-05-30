import { useState } from 'react'
import { trackEvent } from '../core/analytics'
import type { ScanReport } from '../core/types'
import { downloadJson, toFixChecklist, toMarkdownReport } from '../core/report'

type ReportActionsProps = {
  report: ScanReport
  copied: boolean
  onCopied: () => void
}

function reportEventParams(report: ScanReport) {
  return {
    finding_count: report.summary.total,
    high_count: report.summary.high,
    medium_count: report.summary.medium,
    low_count: report.summary.low,
    has_high: report.summary.high > 0,
    partial_scan: report.scanLimits.length > 0,
    rules_version: report.rulesVersion,
  }
}

export function ReportActions({ report, copied, onCopied }: ReportActionsProps) {
  const [checklistCopied, setChecklistCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  async function copyText(text: string, onSuccess: () => void) {
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(text)
      onSuccess()
    } catch {
      setCopyError('Clipboard access failed. Select the report text manually or use Download JSON.')
    }
  }

  async function copyReport() {
    await copyText(toMarkdownReport(report), () => {
      trackEvent('copy_markdown_report', reportEventParams(report))
      onCopied()
    })
  }

  async function copyChecklist() {
    await copyText(toFixChecklist(report), () => {
      trackEvent('copy_fix_checklist', reportEventParams(report))
      setChecklistCopied(true)
      window.setTimeout(() => setChecklistCopied(false), 1800)
    })
  }

  function handleDownloadJson() {
    trackEvent('download_json_report', reportEventParams(report))
    downloadJson(report)
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <button className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={copyReport}>
          {copied ? 'Copied Markdown' : 'Copy Markdown'}
        </button>
        <button className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200" type="button" onClick={copyChecklist}>
          {checklistCopied ? 'Copied checklist' : 'Copy fix checklist'}
        </button>
        <button className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200" type="button" onClick={handleDownloadJson}>
          Download JSON
        </button>
      </div>
      {copyError && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{copyError}</p>}
    </div>
  )
}
