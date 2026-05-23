import type { ScanReport } from './types'

export function toMarkdownReport(report: ScanReport): string {
  const lines: string[] = [
    '# Chrome Web Store Preflight Report',
    '',
    `- ZIP: ${report.zipName}`,
    `- Scanned at: ${report.scannedAt}`,
    `- Manifest: ${report.manifestPath ?? 'Not found'}`,
    `- Summary: ${report.summary.high} High, ${report.summary.medium} Medium, ${report.summary.low} Low`,
    '',
    '> Static preflight scan only. Not an official Chrome Web Store validator.',
    '',
    '## Findings',
    '',
  ]

  if (report.findings.length === 0) lines.push('No findings detected by the current static rules.', '')

  for (const finding of report.findings) {
    lines.push(`### ${finding.ruleId}: ${finding.title}`)
    if (finding.file) lines.push(`- File: ${finding.file}`)
    if (finding.line) lines.push(`- Line: ${finding.line}`)
    if (finding.snippet) lines.push(`- Snippet: ${finding.snippet}`)
    lines.push(`- Severity: ${finding.severity}`)
    lines.push(`- Reason: ${finding.reason}`)
    lines.push(`- Recommendation: ${finding.recommendation}`)
    if (finding.sourceUrl) lines.push(`- Source: ${finding.sourceUrl}`)
    lines.push('')
  }

  lines.push('## Manual checklist', '')
  for (const item of report.manualChecklist) lines.push(`- ${item.title}: ${item.description}`)
  return lines.join('\n')
}

export function toFixChecklist(report: ScanReport): string {
  const lines: string[] = [
    '# Chrome Extension Fix Checklist',
    '',
    `Summary: ${report.summary.high} High, ${report.summary.medium} Medium, ${report.summary.low} Low`,
    '',
    'Fix high-risk findings first, rebuild the production ZIP, then scan the rebuilt ZIP again.',
    '',
  ]

  if (report.findings.length === 0) {
    lines.push('- No static findings detected by the current rules.')
  } else {
    for (const finding of report.findings) {
      lines.push(`- [ ] ${finding.severity.toUpperCase()} · ${finding.ruleId}: ${finding.title}`)
      if (finding.file) lines.push(`  - Location: ${finding.file}${finding.line ? `:${finding.line}` : ''}`)
      lines.push(`  - Fix: ${finding.recommendation}`)
    }
  }

  if (report.manualChecklist.length > 0) {
    lines.push('', 'Manual review before submission:')
    for (const item of report.manualChecklist) lines.push(`- [ ] ${item.title}: ${item.description}`)
  }

  lines.push('', 'Note: This is a local static preflight scan, not an official Chrome Web Store validator.')
  return lines.join('\n')
}

export function downloadJson(report: ScanReport): void {
  const data = JSON.stringify(report, null, 2)
  const url = `data:application/json;charset=utf-8,${encodeURIComponent(data)}`
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${report.zipName.replace(/\.zip$/i, '')}-preflight-report.json`
  anchor.click()
}
