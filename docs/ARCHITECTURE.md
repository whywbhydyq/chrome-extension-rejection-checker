# Architecture

Chrome Extension Rejection Checker is a pure frontend static scanner.

The MVP goal is to give Chrome extension developers a trustworthy pre-submission smoke check without uploading their source code.

## High-level flow

```txt
User ZIP
  ↓
UploadZone / file input
  ↓
JSZip reads archive locally in browser
  ↓
virtualFileSystem normalizes paths and text files
  ↓
ScannerContext is created
  ↓
ruleEngine runs all rule modules
  ↓
ScanReport is created
  ↓
UI renders findings and export actions
```

## Key design principle

Rules consume `ScannerContext`. Rules must not call JSZip directly.

This keeps the scanner portable. Later, the same rule engine can be reused for:

- CLI
- GitHub Action
- browser extension
- serverless batch checker

The MVP still stays web-first.

## Directory structure

```txt
.
├── PRD.md
├── requirements.md
├── QUICKSTART.md
├── README.md
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tailwind.config.ts
├── postcss.config.js
├── scripts/
│   └── build-archives.mjs
├── src/
│   ├── app/
│   │   └── App.tsx
│   ├── core/
│   │   ├── lineUtils.ts
│   │   ├── report.ts
│   │   ├── ruleEngine.ts
│   │   ├── types.ts
│   │   ├── virtualFileSystem.ts
│   │   └── zipReader.ts
│   ├── rules/
│   │   ├── cspRules.ts
│   │   ├── iconRules.ts
│   │   ├── manifestRules.ts
│   │   ├── permissionRules.ts
│   │   ├── privacyRules.ts
│   │   └── remoteCodeRules.ts
│   ├── main.tsx
│   └── styles.css
├── fixtures-src/
│   ├── valid-mv3-extension/
│   ├── remote-script-extension/
│   ├── eval-extension/
│   ├── packaging-mistake-extension/
│   ├── missing-manifest-extension/
│   └── extension-test/
└── fixtures/
    └── generated ZIP files
```

## Core modules

### `src/core/zipReader.ts`

Responsibilities:

- Validate `.zip` input
- Load archive with JSZip
- Ignore unwanted metadata paths like `__MACOSX/`
- Find `manifest.json`
- Detect whether the manifest is at ZIP root
- Build normalized virtual files
- Parse manifest JSON
- Split files into text, JavaScript, and HTML groups

### `src/core/virtualFileSystem.ts`

Responsibilities:

- Normalize path separators
- Strip root prefix when the user zipped a parent folder
- Infer file extensions
- Create `VirtualFile` records

### `src/core/ruleEngine.ts`

Responsibilities:

- Register rule modules
- Run rules against one `ScannerContext`
- Build the final `ScanReport`
- Attach the manual checklist

### `src/core/report.ts`

Responsibilities:

- Convert findings to Markdown
- Generate JSON download

## Rule modules

### `manifestRules.ts`

Covers:

- CWS003: missing manifest
- CWS003: invalid manifest JSON
- CWS003: non-MV3 manifest
- CWS003: manifest not at ZIP root
- CWS004: manifest referenced file missing

### `remoteCodeRules.ts`

Covers:

- CWS001: remote hosted executable code
- CWS002: dynamic string-code execution
- CWS010: remote URL found for manual review

Important boundary:

Do not classify all remote URLs as High. Only likely executable remote code should be High.

### `cspRules.ts`

Covers:

- CWS005: `unsafe-eval`
- CWS005: remote `script-src`

Important boundary:

Do not classify `wasm-unsafe-eval` as dangerous by itself.

### `permissionRules.ts`

Covers:

- CWS006: broad host permissions
- CWS007: sensitive Chrome API permissions

Important boundary:

These are Medium review risks, not automatic rejection claims.

### `privacyRules.ts`

Covers:

- CWS008: privacy disclosure review needed

Important boundary:

The scanner cannot know Developer Dashboard privacy fields, so this rule is a reminder only.

### `iconRules.ts`

Covers:

- CWS009: missing icon declaration
- CWS009: declared icon path missing

MVP only checks path existence. Pixel dimension verification is P1.

## Finding object

```ts
type Finding = {
  ruleId: string
  severity: 'high' | 'medium' | 'low'
  title: string
  file?: string
  line?: number
  snippet?: string
  reason: string
  recommendation: string
  sourceUrl?: string
}
```

## ScannerContext object

```ts
type ScannerContext = {
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
}
```

## Severity philosophy

### High

Use for issues that are likely to cause Chrome Web Store rejection, review failure, or packaging failure.

Examples:

- Manifest missing or invalid
- Manifest not at root
- Manifest V2
- Missing files referenced by manifest
- Remote executable code
- `eval()` or `new Function()`
- `unsafe-eval` in extension CSP

### Medium

Use for review risks that require explanation, least-privilege review, or privacy review.

Examples:

- Broad host permissions
- Sensitive permissions
- Privacy disclosure reminders
- Missing icons

### Low

Use for review notes where the user should manually verify intent.

Examples:

- Remote URLs that do not obviously load executable code

## Future architecture upgrades

After the MVP proves demand:

1. Add AST-based JavaScript scanner.
2. Add HTML parser instead of regex.
3. Add actual icon dimension checks.
4. Add CSP parser.
5. Split rules into reusable package.
6. Add CLI and GitHub Action.
7. Add fixture-based tests for every rule.
