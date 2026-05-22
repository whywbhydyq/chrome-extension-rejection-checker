# Requirements: Chrome Web Store Preflight Checker MVP

## Non-negotiable principles

1. Web local scanner first. Do not move the MVP toward CLI-first.
2. All scanning must happen inside the user's browser.
3. Do not upload source code, store files, or send file contents to analytics.
4. High findings must be conservative and accurate.
5. Prefer fewer High findings over noisy false positives.
6. Provide source links and practical recommendations for every finding.
7. The product is a static preflight scanner, not an official validator and not a guarantee of approval.

## Runtime and stack

| Layer | Choice |
|---|---|
| App framework | Vite + React + TypeScript |
| Styling | Tailwind CSS |
| ZIP parsing | JSZip |
| JS scanning | Regex/string MVP; AST parser later |
| HTML scanning | Regex/string MVP; parser later |
| JSON validation | Lightweight runtime guards; zod optional later |
| Hosting | Vercel or Cloudflare Pages |
| Backend | None |
| Storage | None |

## Repository shape

```txt
src/
  app/
    App.tsx
  components/
    FindingList.tsx
    ManualChecklist.tsx
    ReportActions.tsx
    ScanSummary.tsx
    UploadZone.tsx
  core/
    lineUtils.ts
    report.ts
    ruleEngine.ts
    types.ts
    virtualFileSystem.ts
    zipReader.ts
  rules/
    cspRules.ts
    iconRules.ts
    index.ts
    manifestRules.ts
    permissionRules.ts
    privacyRules.ts
    remoteCodeRules.ts
  main.tsx
  styles.css
fixtures/
  valid-mv3-extension.zip
  remote-script-extension.zip
  eval-extension.zip
  packaging-mistake-extension.zip
```

## ScannerContext contract

Rules must consume a normalized context and must not call JSZip directly.

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

## Rule behavior

### CWS001: Remote hosted code risk

Severity: High

Detect only likely code execution from remote locations:

- `<script src="https://...">`
- `importScripts("https://...")`
- `import "https://...js"`
- `import("https://...mjs")`
- dynamic script element assigned to a remote JS URL
- `WebAssembly.instantiateStreaming(fetch("https://...wasm"))`
- `WebAssembly.compileStreaming(fetch("https://...wasm"))`

Do not classify normal API, image, CSS, JSON, or documentation URLs as High.

### CWS002: Dynamic code execution

Severity: High

Detect:

- `eval(`
- `new Function(`
- `setTimeout("...")`
- `setInterval("...")`

The report should say this is a strong review risk and commonly blocked by extension CSP. It should not claim malicious intent.

### CWS003: Manifest problem

Severity: High

Detect:

- No `manifest.json`
- Invalid JSON
- `manifest_version !== 3`
- `manifest.json` exists only inside a subdirectory, not at zip root

If a nested manifest is found, still scan it so the user gets useful follow-up findings.

### CWS004: Missing referenced files

Severity: High

Check manifest references:

- `background.service_worker`
- `action.default_popup`
- `options_page`
- `options_ui.page`
- `devtools_page`
- `side_panel.default_path`
- `content_scripts[].js`
- `content_scripts[].css`
- `icons`
- `web_accessible_resources[].resources`
- `declarative_net_request.rule_resources[].path`

### CWS005: Unsafe extension CSP

Severity: High

Detect in extension page CSP:

- `'unsafe-eval'`
- remote sources in `script-src`

Do not flag `'wasm-unsafe-eval'` by itself.

### CWS006: Broad host permissions

Severity: Medium

Detect:

- `<all_urls>`
- `*://*/*`
- broad wildcard host patterns

Wording must be "may increase review scrutiny", not "will be rejected".

### CWS007: Sensitive Chrome API permissions

Severity: Medium

Initial sensitive permissions:

- `tabs`
- `webRequest`
- `webRequestBlocking`
- `debugger`
- `cookies`
- `history`
- `identity`
- `management`
- `nativeMessaging`
- `scripting`

Wording must explain that permissions should be minimized and justified.

### CWS008: Privacy disclosure review needed

Severity: Medium

Trigger when permissions may involve user data or user activity:

- `storage`
- `identity`
- `cookies`
- `history`
- `tabs`
- `bookmarks`
- `downloads`
- `topSites`
- broad host permissions

Do not assert that a privacy policy is definitely required. Tell the user to review Chrome Web Store privacy policy and privacy practices fields.

### CWS009: Icon missing or path missing

Severity: Medium

MVP:

- Report if `icons` is missing.
- Report if declared icon paths do not exist.

P1:

- Verify actual image dimensions for 16/32/48/128.

### CWS010: Remote URL found; manual review needed

Severity: Low

Detect remote URLs that are not classified as executable code. This gives the user a review list without creating false High findings.

## Manual checklist

The UI should show a manual checklist for items the zip scanner cannot know:

- Developer Dashboard privacy policy URL
- Privacy practices fields
- Permission justifications
- Single purpose description
- Store listing description accuracy
- Version number and release notes
- Account and item policy compliance

These are not static findings.

## Reporting requirements

Each finding must include:

- Rule ID
- Severity
- Title
- File path
- Line number when available
- Short snippet when available
- Reason
- Recommendation
- Official source URL when available

The report page must support:

- Severity summary
- Grouped finding list
- Copy Markdown
- Download JSON

## Acceptance criteria

A user can:

1. Open the local web app.
2. Drag in a zip.
3. See whether `manifest.json` is valid and at root.
4. See High findings for obvious RHC and eval cases.
5. See missing file references.
6. Copy a Markdown report.
7. Download a JSON report.
8. Understand that the scan is local and not a guarantee of review approval.

## Fixtures

Required fixtures:

- Valid MV3 extension
- Missing manifest extension
- Remote script extension
- Eval extension
- Packaging mistake extension with nested manifest

## Future scope

Only after MVP validation:

- AST-based JavaScript scanning
- Real icon dimension checks
- More precise CSP parser
- GitHub Action
- CLI
- Diff mode for release zips
- Optional AI explanation layer without uploading source
