import { trackEvent } from '../core/analytics'
import type { ScanProgress } from '../core/types'

type UploadZoneProps = {
  scanning: boolean
  progress?: ScanProgress | null
  onFile: (file: File) => void
}

function progressLabel(progress?: ScanProgress | null): string {
  if (!progress) return 'Scanning locally…'
  if (progress.phase === 'loading_zip') return 'Reading ZIP metadata…'
  if (progress.phase === 'running_rules') return 'Running static rules…'
  if (progress.totalEntries) return `Reading ${progress.processedEntries ?? 0}/${progress.totalEntries} files…`
  return 'Reading ZIP files…'
}

export function UploadZone({ scanning, progress, onFile }: UploadZoneProps) {
  const inputId = 'extension-zip-input'

  function handleFile(file?: File | null, source: 'input' | 'drop' = 'input') {
    if (!file) return
    if (scanning) {
      trackEvent('upload_blocked_during_scan', { source_component: 'upload_zone', upload_source: source })
      return
    }
    onFile(file)
  }

  function trackUploadClick() {
    if (scanning) return
    trackEvent('upload_click', {
      cta_text: 'Choose production ZIP',
      source_component: 'upload_zone',
    })
  }

  return (
    <div
      className="flex h-full min-h-[360px] flex-col justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-7 text-center shadow-sm hover:border-slate-500 focus-within:border-slate-950 focus-within:ring-4 focus-within:ring-slate-200 sm:p-8"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        handleFile(event.dataTransfer.files.item(0), 'drop')
      }}
    >
      <label htmlFor={inputId} className={scanning ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} aria-disabled={scanning} onClick={trackUploadClick}>
        <span className="block text-2xl font-black tracking-tight text-slate-950">Drop the final production ZIP</span>
        <span id="zip-help" className="mx-auto mt-3 block max-w-md text-sm leading-6 text-slate-600">
          Use the same ZIP you plan to submit. manifest.json should be at the ZIP root. The browser scanner rejects very large packages before reading files.
        </span>
        <span className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          {scanning ? progressLabel(progress) : 'Choose production ZIP'}
        </span>
      </label>
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept=".zip,application/zip"
        aria-describedby="zip-help"
        disabled={scanning}
        onChange={(event) => {
          handleFile(event.currentTarget.files?.item(0), 'input')
          event.currentTarget.value = ''
        }}
      />
      <div className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">No upload</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">No signup</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">50 MB ZIP limit</span>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Need details? Read <a className="font-semibold underline" href="/privacy">privacy notes</a> or <a className="font-semibold underline" href="/how-it-works">how the scanner works</a>.
      </p>
    </div>
  )
}
