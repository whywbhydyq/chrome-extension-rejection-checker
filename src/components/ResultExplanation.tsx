import type { ScanReport } from '../core/types'

type ResultExplanationProps = {
  report: ScanReport
}

export function ResultExplanation({ report }: ResultExplanationProps) {
  const { high, medium, low } = report.summary

  if (high > 0) {
    return (
      <section className="rounded-3xl bg-red-50 p-6 ring-1 ring-red-100" aria-labelledby="result-explanation-title">
        <h2 id="result-explanation-title" className="text-xl font-black text-red-950">
          Fix high-risk findings before submitting
        </h2>
        <p className="mt-3 text-sm leading-6 text-red-900">
          This scan found issues commonly associated with Chrome Web Store rejection, such as missing manifest files,
          remote executable code, invalid Manifest V3 packaging, or dynamic string-code execution. Fix these items,
          rebuild the production ZIP, and scan the rebuilt ZIP again.
        </p>
        <a className="mt-4 inline-block text-sm font-bold text-red-950 underline" href="/manifest-v3-pre-submission-checklist">
          Review the Manifest V3 pre-submission checklist
        </a>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-red-800">
          Local static preflight scan only. Not an official Chrome Web Store approval result.
        </p>
      </section>
    )
  }

  if (medium > 0) {
    return (
      <section className="rounded-3xl bg-amber-50 p-6 ring-1 ring-amber-100" aria-labelledby="result-explanation-title">
        <h2 id="result-explanation-title" className="text-xl font-black text-amber-950">
          Review permissions, CSP, and privacy disclosures
        </h2>
        <p className="mt-3 text-sm leading-6 text-amber-900">
          No high-risk static issue was detected, but permissions or privacy-related signals may need clear justification
          in your Chrome Web Store listing, privacy policy, and Developer Dashboard fields.
        </p>
        <a className="mt-4 inline-block text-sm font-bold text-amber-950 underline" href="/chrome-extension-host-permissions-privacy-review">
          Open the permissions and privacy review checklist
        </a>
      </section>
    )
  }

  if (low > 0) {
    return (
      <section className="rounded-3xl bg-slate-100 p-6 ring-1 ring-slate-200" aria-labelledby="result-explanation-title">
        <h2 id="result-explanation-title" className="text-xl font-black text-slate-950">
          Manual review recommended
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The scanner found low-risk review notes. Confirm that any remote URLs are used for data, images, APIs, or
          documentation, not for loading executable JavaScript or WebAssembly.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-3xl bg-emerald-50 p-6 ring-1 ring-emerald-100" aria-labelledby="result-explanation-title">
      <h2 id="result-explanation-title" className="text-xl font-black text-emerald-950">
        No common static rejection risks detected
      </h2>
      <p className="mt-3 text-sm leading-6 text-emerald-900">
        This scan did not find the common issues covered by this checker. Before publishing, still review your Chrome Web
        Store listing, privacy disclosures, screenshots, single-purpose statement, and reviewer instructions.
      </p>
    </section>
  )
}
