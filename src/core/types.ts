export type Severity = 'high' | 'medium' | 'low'

export type Finding = {
  ruleId: string
  severity: Severity
  title: string
  file?: string
  line?: number
  snippet?: string
  reason: string
  recommendation: string
  sourceUrl?: string
  confidence?: string
}

export type ScanLimit = {
  code: string
  severity: Severity
  title: string
  file?: string
  size?: number
  reason: string
  recommendation: string
}


export type VirtualFile = {
  path: string
  normalizedPath: string
  size: number
  extension: string
  isText: boolean
  text?: string
  bytes?: Uint8Array
}

export type ScannerContext = {
  zipName: string
  manifestPath?: string
  manifestAtRoot: boolean
  manifest?: Record<string, unknown>
  manifestParseError?: string
  rootPrefix: string
  files: Map<string, VirtualFile>
  allFiles: VirtualFile[]
  textFiles: VirtualFile[]
  jsFiles: VirtualFile[]
  htmlFiles: VirtualFile[]
  scanLimits: ScanLimit[]
}

export type ScanSummary = {
  total: number
  high: number
  medium: number
  low: number
}

export type ManualChecklistItem = {
  title: string
  description: string
}

export type ScanReport = {
  zipName: string
  scannedAt: string
  manifestPath?: string
  summary: ScanSummary
  findings: Finding[]
  manualChecklist: ManualChecklistItem[]
  rulesVersion: string
  scanLimits: ScanLimit[]
}
