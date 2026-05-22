type UploadZoneProps = {
  scanning: boolean
  onFile: (file: File) => void
}

export function UploadZone({ scanning, onFile }: UploadZoneProps) {
  return (
    <label
      className="mx-auto mt-10 flex max-w-3xl cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center shadow-sm hover:border-slate-500"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const file = event.dataTransfer.files.item(0)
        if (file) onFile(file)
      }}
    >
      <span className="text-xl font-semibold">Drop your extension .zip here</span>
      <span className="mt-2 text-sm text-slate-600">No upload. No signup. Static preflight scan only.</span>
      <input
        className="hidden"
        type="file"
        accept=".zip,application/zip"
        disabled={scanning}
        onChange={(event) => {
          const file = event.currentTarget.files?.item(0)
          if (file) onFile(file)
          event.currentTarget.value = ''
        }}
      />
    </label>
  )
}
