type AnalyticsParams = Record<string, string | number | boolean | undefined>

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
    ...params,
  })
}

export function findingRuleSummary(ruleIds: string[]): string {
  return Array.from(new Set(ruleIds)).sort().join(',')
}
