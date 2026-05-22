export function EmptyState() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="font-semibold">No static findings in this scan</h3>
      <p className="mt-2 text-sm text-slate-600">Still review the manual checklist before submitting. This tool is not an official validator.</p>
    </div>
  )
}
