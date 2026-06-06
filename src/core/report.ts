import { guideActionsForFindings, guideForFinding } from './guideLinks'
import type { ScanReport } from './types'

export function toMarkdownReport(report: ScanReport): string {
  const lines: string[] = [
    '# Chrome Web Store Preflight Report',
    '',
    `- ZIP: ${report.zipName}`,
    `- Scanned at: ${report.scannedAt}`,
    `- Manifest: ${report.manifestPath ?? 'Not found'}`,
    `- Rules version: ${report.rulesVersion}`,
    `- Summary: ${report.summary.high} High, ${report.summary.medium} Medium, ${report.summary.low} Low`,
    '',
    '> Static preflight scan only. Not an official Chrome Web Store validator.',
    '',
  ]

  if (report.scanLimits.length > 0) {
    lines.push('## Scan limits', '')
    lines.push('These are local browser safety notes, not code-policy findings. Review skipped or partially read files manually before submission.', '')
    for (const limit of report.scanLimits) {
      lines.push(`- ${limit.severity.toUpperCase()} · ${limit.code}: ${limit.title}`)
      if (limit.file) lines.push(`  - File: ${limit.file}`)
      if (limit.size) lines.push(`  - Size: ${limit.size} bytes`)
      lines.push(`  - Reason: ${limit.reason}`)
      lines.push(`  - Recommendation: ${limit.recommendation}`)
    }
    lines.push('')
  }

  const suggestedGuides = guideActionsForFindings(report.findings)
  if (suggestedGuides.length > 0) {
    lines.push('## Suggested fix path', '')
    for (const [index, guide] of suggestedGuides.entries()) {
      lines.push(`${index + 1}. ${guide.label}: ${guide.href}`)
      lines.push(`   - Matched rules: ${guide.ruleIds.sort().join(', ')}`)
      lines.push(`   - Why: ${guide.note}`)
    }
    lines.push('')
  }

  lines.push('## Findings', '')
  if (report.findings.length === 0) lines.push('No code-policy findings detected by the current static rules.', '')

  for (const finding of report.findings) {
    lines.push(`### ${finding.ruleId}: ${finding.title}`)
    if (finding.file) lines.push(`- File: ${finding.file}`)
    if (finding.line) lines.push(`- Line: ${finding.line}`)
    if (finding.snippet) lines.push(`- Snippet: ${finding.snippet}`)
    lines.push(`- Severity: ${finding.severity}`)
    if (finding.confidence) lines.push(`- Confidence: ${finding.confidence}`)
    lines.push(`- Reason: ${finding.reason}`)
    lines.push(`- Recommendation: ${finding.recommendation}`)
    const guide = guideForFinding(finding)
    if (guide) lines.push(`- Guide: ${guide.label} (${guide.href})`)
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
    `Rules version: ${report.rulesVersion}`,
    '',
    'Fix high-risk findings first, rebuild the production ZIP, then scan the rebuilt ZIP again.',
    '',
  ]

  if (report.findings.length === 0) {
    lines.push('- No code-policy findings detected by the current rules.')
  } else {
    for (const finding of report.findings) {
      const guide = guideForFinding(finding)
      lines.push(`- [ ] ${finding.severity.toUpperCase()} · ${finding.ruleId}: ${finding.title}`)
      if (finding.file) lines.push(`  - Location: ${finding.file}${finding.line ? `:${finding.line}` : ''}`)
      lines.push(`  - Fix: ${finding.recommendation}`)
      if (guide) lines.push(`  - Guide: ${guide.label} (${guide.href})`)
    }
  }

  if (report.scanLimits.length > 0) {
    lines.push('', 'Scan limit notes, separate from code findings:')
    for (const limit of report.scanLimits) {
      lines.push(`- [ ] ${limit.severity.toUpperCase()} · ${limit.code}: ${limit.title}${limit.file ? ` (${limit.file})` : ''}`)
      lines.push(`  - Review: ${limit.recommendation}`)
    }
  }

  if (report.manualChecklist.length > 0) {
    lines.push('', 'Manual review before submission:')
    for (const item of report.manualChecklist) lines.push(`- [ ] ${item.title}: ${item.description}`)
  }

  lines.push('', 'Note: This is a local static preflight scan, not an official Chrome Web Store validator. Clean results still require manual review of runtime behavior, store listing, privacy disclosures, and Developer Dashboard fields.')
  return lines.join('\n')
}

function safeReportFilename(zipName: string): string {
  const baseName = zipName.replace(/\.zip$/i, '').replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '')
  return `${(baseName || 'extension').slice(0, 80)}-preflight-report.json`
}

export function downloadJson(report: ScanReport): void {
  const data = JSON.stringify(report, null, 2)
  const blob = new Blob([data], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = safeReportFilename(report.zipName)
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
