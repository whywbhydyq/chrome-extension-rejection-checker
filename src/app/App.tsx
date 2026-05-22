import { useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { FindingList } from '../components/FindingList'
import { HeroSection } from '../components/HeroSection'
import { ManualChecklist } from '../components/ManualChecklist'
import { ScanSummary } from '../components/ScanSummary'
import { SeoContent } from '../components/SeoContent'
import { SeverityGuide } from '../components/SeverityGuide'
import { UploadZone } from '../components/UploadZone'
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
  if (seoPage) return <SeoPage page={seoPage} />

  async function scan(file: File) {
    setScanning(true)
    setError(null)
    setCopied(false)
    try {
      const context = await readExtensionZip(file)
      setReport(scanContext(context))
    } catch (err) {
      setReport(null)
      setError(err instanceof Error ? err.message : 'Could not scan this zip.')
    } finally {
      setScanning(false)
    }
  }

  function handleCopied() {
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <HeroSection />
        <UploadZone scanning={scanning} onFile={(file) => void scan(file)} />

        <div className="mx-auto mt-5 max-w-3xl rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
          Packaging tip: when submitting to Chrome Web Store, zip the files inside your extension folder so manifest.json is at the ZIP root.
        </div>

        {scanning && <p className="mt-4 text-center text-sm text-slate-600">Scanning locally…</p>}
        {error && <p className="mx-auto mt-4 max-w-3xl rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

        {report && (
          <section className="mt-10 space-y-6">
            <ScanSummary report={report} copied={copied} onCopied={handleCopied} />
            {report.findings.length === 0 ? <EmptyState /> : <FindingList report={report} />}
            <ManualChecklist items={report.manualChecklist} />
          </section>
        )}

        <SeverityGuide />
        <SeoContent />
      </section>
    </main>
  )
}
