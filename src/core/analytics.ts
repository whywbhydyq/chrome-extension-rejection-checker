type AnalyticsParams = Record<string, string | number | boolean | undefined>

const contentVersion = '2026-05-30'
const rulesVersion = '2026-05-30-mv3-static-rules'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

export function trackEvent(event: string, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event,
    page_type: 'tool',
    tool_name: 'chrome_extension_rejection_checker',
    content_version: contentVersion,
    rules_version: rulesVersion,
    ...params,
  })
}

export function findingRuleSummary(ruleIds: string[]): string {
  return Array.from(new Set(ruleIds)).sort().join(',')
}
