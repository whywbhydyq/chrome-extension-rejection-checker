import { trackEvent } from '../core/analytics'

type UploadZoneProps = {
  scanning: boolean
  onFile: (file: File) => void
}

export function UploadZone({ scanning, onFile }: UploadZoneProps) {
  const inputId = 'extension-zip-input'

  function handleFile(file?: File | null) {
    if (!file) return
    onFile(file)
  }

  function trackUploadClick() {
    trackEvent('upload_click', {
      cta_text: 'Choose production ZIP',
      source_component: 'upload_zone',
    })
  }

  return (
    <div
      className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center shadow-sm hover:border-slate-500 focus-within:border-slate-950 focus-within:ring-4 focus-within:ring-slate-200 sm:p-10"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        handleFile(event.dataTransfer.files.item(0))
      }}
    >
      <label htmlFor={inputId} className="cursor-pointer" onClick={trackUploadClick}>
        <span className="block text-xl font-semibold">Scan extension ZIP locally</span>
        <span id="zip-help" className="mt-2 block text-sm leading-6 text-slate-600">
          Select or drop the production ZIP you plan to submit. manifest.json should be at the ZIP root.
        </span>
        <span className="mt-4 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          {scanning ? 'Scanning locally…' : 'Choose production ZIP'}
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
          handleFile(event.currentTarget.files?.item(0))
          event.currentTarget.value = ''
        }}
      />
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
        No upload · No signup · Browser-only static scan
      </p>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Need details? Read <a className="font-semibold underline" href="/privacy">privacy notes</a> or <a className="font-semibold underline" href="/how-it-works">how the scanner works</a>.
      </p>
    </div>
  )
}
