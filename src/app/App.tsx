import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { FindingList } from '../components/FindingList'
import { HeroSection } from '../components/HeroSection'
import { ManualChecklist } from '../components/ManualChecklist'
import { SampleReportPreview } from '../components/SampleReportPreview'
import { ScanSummary } from '../components/ScanSummary'
import { SeoContent } from '../components/SeoContent'
import { SeverityGuide } from '../components/SeverityGuide'
import { UploadZone } from '../components/UploadZone'
import { findingRuleSummary, trackEvent } from '../core/analytics'
import { scanContext } from '../core/ruleEngine'
import type { ScanReport } from '../core/types'
import { readExtensionZip } from '../core/zipReader'
import { SeoPage } from '../pages/SeoPage'
import { seoPages } from '../pages/seoPages'

export function App() {
  const [report, setReport] = useState<ScanReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [copied, setCopied] = useState(false)

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/'
  const seoPage = seoPages.find((page) => page.path === currentPath)

  useEffect(() => {
    trackEvent('tool_view', {
      path: currentPath,
      page_kind: seoPage ? 'guide' : 'tool_home',
    })
  }, [currentPath, seoPage])

  if (seoPage) return <SeoPage page={seoPage} />

  async function scan(file: File) {
    setScanning(true)
    setError(null)
    setCopied(false)
    trackEvent('scan_start')
    try {
      const context = await readExtensionZip(file)
      const nextReport = scanContext(context)
      setReport(nextReport)
      trackEvent('scan_success', {
        finding_count: nextReport.summary.total,
        high_count: nextReport.summary.high,
        medium_count: nextReport.summary.medium,
        low_count: nextReport.summary.low,
        rules_version: nextReport.rulesVersion,
        partial_scan: nextReport.scanLimits.length > 0,
      })
      if (nextReport.summary.high > 0) {
        trackEvent('high_finding_detected', {
          high_count: nextReport.summary.high,
          rule_ids: findingRuleSummary(nextReport.findings.filter((finding) => finding.severity === 'high').map((finding) => finding.ruleId)),
        })
      }
    } catch (err) {
      setReport(null)
      setError(err instanceof Error ? err.message : 'Could not scan this zip.')
      trackEvent('scan_failed', { error_reason: 'scan_exception' })
    } finally {
      setScanning(false)
    }
  }

  function handleCopied() {
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:py-10">
      <section className="mx-auto max-w-6xl">
        <HeroSection />

        <section className="mt-8 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]" aria-label="Local ZIP scanner workbench">
          <div className="space-y-4">
            <UploadZone scanning={scanning} onFile={(file) => void scan(file)} />

            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
              Packaging tip: when submitting to Chrome Web Store, zip the files inside your extension folder so manifest.json is at the ZIP root.
            </div>

            {scanning && <p className="text-sm text-slate-600" role="status" aria-live="polite">Scanning locally in this browser…</p>}
            {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{error}</p>}
          </div>

          {report ? <ScanSummary report={report} copied={copied} onCopied={handleCopied} /> : <SampleReportPreview scanning={scanning} />}
        </section>

        {report && (
          <section className="mt-8 space-y-6" aria-label="Detailed scan results">
            {report.findings.length === 0 ? <EmptyState /> : <FindingList report={report} />}
            <ManualChecklist items={report.manualChecklist} />
          </section>
        )}

        <SeverityGuide />
        <SeoContent />

        <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-600">
          <p>
            Chrome Extension Rejection Checker is an independent local preflight scanner. It is not affiliated with Google or Chrome Web Store and does not guarantee approval.
          </p>
          <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Site policy links">
            <a className="font-medium text-slate-700 hover:text-slate-950" href="/about">About</a>
            <a className="font-medium text-slate-700 hover:text-slate-950" href="/privacy">Privacy</a>
            <a className="font-medium text-slate-700 hover:text-slate-950" href="/terms">Terms</a>
            <a className="font-medium text-slate-700 hover:text-slate-950" href="/disclaimer">Disclaimer</a>
            <a className="font-medium text-slate-700 hover:text-slate-950" href="/contact">Contact</a>
          </nav>
        </footer>
      </section>
    </main>
  )
}
