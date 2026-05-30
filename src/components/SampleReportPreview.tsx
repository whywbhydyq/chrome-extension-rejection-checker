type SampleReportPreviewProps = {
  scanning: boolean
}

const coveredRules = [
  'Root manifest.json and Manifest V3 package structure',
  'Remote scripts, dynamic imports, workers, service workers, worklets, and remote WASM',
  'eval, Function constructor, and string-based timers',
  'CSP script-src, worker-src, object-src, and unsafe-eval checks',
  'Missing referenced files, broad permissions, icons, and privacy review reminders',
]

export function SampleReportPreview({ scanning }: SampleReportPreviewProps) {
  return (
    <aside className="h-full rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200" aria-label="Sample scan report preview">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Report preview</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {scanning ? 'Scanning your ZIP locally…' : 'Preview will appear after scan'}
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Static preflight</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
          <div className="text-2xl font-black text-red-700">High</div>
          <div className="mt-1 text-xs font-bold text-red-800">Fix first</div>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
          <div className="text-2xl font-black text-amber-700">Medium</div>
          <div className="mt-1 text-xs font-bold text-amber-800">Review</div>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4 ring-1 ring-slate-200">
          <div className="text-2xl font-black text-slate-700">Low</div>
          <div className="mt-1 text-xs font-bold text-slate-700">Manual</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <h3 className="text-sm font-black text-slate-950">Rules covered in this local scan</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {coveredRules.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-950 ring-1 ring-blue-100">
        <strong>Privacy boundary:</strong> ZIP contents stay in this browser. Analytics must not receive ZIP names, file paths, manifest content, snippets, detected URLs, or source code.
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Clean results are not an approval guarantee. Chrome Web Store can still review runtime behavior, Developer Dashboard fields, listing copy, user data handling, and policy compliance.
      </p>
    </aside>
  )
}
