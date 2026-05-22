import type { ManualChecklistItem } from '../core/types'

type ManualChecklistProps = {
  items: ManualChecklistItem[]
}

export function ManualChecklist({ items }: ManualChecklistProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-bold">Manual checklist</h2>
      <p className="mt-2 text-sm text-slate-600">Review these Chrome Web Store dashboard items separately.</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.title} className="rounded-2xl bg-slate-50 p-4">
            <strong>{item.title}</strong>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
