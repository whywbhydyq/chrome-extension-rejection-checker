import { useEffect, useRef, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { FindingList } from '../components/FindingList'
import { HeroSection } from '../components/HeroSection'
import { LocalScanFlow } from '../components/LocalScanFlow'
import { ManualChecklist } from '../components/ManualChecklist'
import { SampleReportPreview } from '../components/SampleReportPreview'
import { ScanSummary } from '../components/ScanSummary'
import { SeoContent } from '../components/SeoContent'
import { SeverityGuide } from '../components/SeverityGuide'
import { UploadZone } from '../components/UploadZone'
import { findingRuleSummary, trackEvent } from '../core/analytics'
import { scanContext } from '../core/ruleEngine'
import type { ScanProgress, ScanReport } from '../core/types'
import { readExtensionZip } from '../core/zipReader'
import { SeoPage } from '../pages/SeoPage'
import { seoPages } from '../pages/seoPages'

export function App() {
  const [report, setReport] = useState<ScanReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null)
  const activeScanIdRef = useRef(0)
  const activeAbortControllerRef = useRef<AbortController | null>(null)
  const scanningRef = useRef(false)

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/'
  const seoPage = seoPages.find((page) => page.path === currentPath)

  useEffect(() => {
    trackEvent('tool_view', {
      path: currentPath,
      page_kind: seoPage ? 'guide' : 'tool_home',
    })
  }, [currentPath, seoPage])

  useEffect(() => {
    return () => activeAbortControllerRef.current?.abort()
  }, [])

  if (seoPage) return <SeoPage page={seoPage} />

  async function scan(file: File) {
    if (scanningRef.current) {
      trackEvent('scan_ignored', { reason: 'scan_already_in_progress' })
      return
    }

    const scanId = activeScanIdRef.current + 1
    const abortController = new AbortController()
    activeScanIdRef.current = scanId
    activeAbortControllerRef.current = abortController
    scanningRef.current = true
    setScanning(true)
    setScanProgress({ phase: 'loading_zip' })
    setError(null)
    setCopied(false)
    trackEvent('scan_start')

    const startedAt = performance.now()
    try {
      const context = await readExtensionZip(file, {
        signal: abortController.signal,
        onProgress: (progress) => {
          if (activeScanIdRef.current === scanId) setScanProgress(progress)
        },
      })
      if (activeScanIdRef.current !== scanId) return

      setScanProgress({ phase: 'running_rules' })
      const nextReport = scanContext(context)
      if (activeScanIdRef.current !== scanId) return

      setReport(nextReport)
      trackEvent('scan_success', {
        finding_count: nextReport.summary.total,
        high_count: nextReport.summary.high,
        medium_count: nextReport.summary.medium,
        low_count: nextReport.summary.low,
        rules_version: nextReport.rulesVersion,
        partial_scan: nextReport.scanLimits.length > 0,
        duration_ms: Math.round(performance.now() - startedAt),
      })
      if (nextReport.summary.high > 0) {
        trackEvent('high_finding_detected', {
          high_count: nextReport.summary.high,
          rule_ids: findingRuleSummary(nextReport.findings.filter((finding) => finding.severity === 'high').map((finding) => finding.ruleId)),
        })
      }
    } catch (err) {
      if (activeScanIdRef.current !== scanId) return
      if (err instanceof DOMException && err.name === 'AbortError') {
        trackEvent('scan_aborted')
        return
      }
      setReport(null)
      setError(err instanceof Error ? err.message : 'Could not scan this zip.')
      trackEvent('scan_failed', { error_reason: 'scan_exception' })
    } finally {
      if (activeScanIdRef.current === scanId) {
        setScanning(false)
        setScanProgress(null)
        scanningRef.current = false
        activeAbortControllerRef.current = null
      }
    }
  }

  function handleCopied() {
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:py-10">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 rounded-3xl bg-white/80 px-5 py-4 shadow-sm ring-1 ring-slate-200 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <a className="text-sm font-black tracking-tight text-slate-950" href="/">Chrome Extension Rejection Checker</a>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-600" aria-label="Primary navigation">
            <a className="hover:text-slate-950" href="/guides">Guides</a>
            <a className="hover:text-slate-950" href="/how-it-works">How it works</a>
            <a className="hover:text-slate-950" href="/privacy">Privacy</a>
            <a className="hover:text-slate-950" href="/fix-remote-hosted-code-manifest-v3">Rules covered</a>
          </nav>
        </header>

        <HeroSection />
        <LocalScanFlow />

        <section className="mt-8 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]" aria-label="Local ZIP scanner workbench">
          <div className="space-y-4">
            <UploadZone scanning={scanning} progress={scanProgress} onFile={(file) => void scan(file)} />

            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
              Packaging tip: when submitting to Chrome Web Store, zip the files inside your extension folder so manifest.json is at the ZIP root.
            </div>

            {scanning && <p className="text-sm text-slate-600" role="status" aria-live="polite">{scanProgress?.phase === 'reading_entries' && scanProgress.totalEntries ? `Reading ZIP entries ${scanProgress.processedEntries ?? 0}/${scanProgress.totalEntries} locally…` : scanProgress?.phase === 'running_rules' ? 'Running static rules locally…' : 'Preparing the ZIP scan locally…'}</p>}
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
            <a className="font-medium text-slate-700 hover:text-slate-950" href="/guides">Guides</a>
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
