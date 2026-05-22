# PRD: Chrome Web Store Preflight Checker

## Product name

**Chrome Web Store Preflight Checker**

Working SEO title / domain keyword:

**Free Local Chrome Web Store Rejection Checker**

## One-line positioning

Chrome extension developers can drag a Chrome extension `.zip` into a web page and run a local-only static preflight scan for common Chrome Web Store rejection risks, including Manifest V3 issues, remotely hosted code, dynamic code execution, missing referenced files, unsafe CSP, broad permissions, icon problems, and privacy disclosure reminders.

The source code never leaves the user's browser.

## Target users

| User | Scenario | Core pain |
|---|---|---|
| Independent extension developer | First Chrome Web Store submission | The official rules are scattered and hard to translate into a zip-level checklist. |
| AI / vibe coding developer | AI generated an extension and the user wants to publish it | They may not understand MV3, permissions, CSP, packaging, or remote hosted code rules. |
| Rejected extension developer | They received a rejection email and need to debug | The rejection reason can be vague and may not point to exact files. |
| Small team developer | They want a pre-release smoke check | They need a fast local check before uploading a release zip. |

## Core problem

Many Chrome Web Store submission failures are caused by issues that can be detected statically in the submitted zip:

- Remotely hosted JavaScript / WebAssembly
- `eval()` / `new Function()` / string-based timers
- Missing or invalid `manifest.json`
- Manifest file references that point to missing files
- Missing icons
- Overbroad host permissions
- High-sensitivity Chrome API permissions
- Unsafe or non-compliant extension CSP
- Privacy disclosure and permission-justification review needs

The product is not a full security scanner. It is a submission-preflight tool.

## Product boundary

### Do

- Run entirely in the browser
- Parse `.zip` files locally
- Read and validate `manifest.json`
- Generate a risk report
- Show file path, line number, snippet, reason, recommendation, and official source URL
- Provide copyable Markdown report
- Provide downloadable JSON report
- Provide a manual checklist for fields that cannot be scanned locally
- Explain common Chrome Web Store rejection causes for SEO and user education

### Do not

- Upload user source code
- Store source files
- Log zip contents
- Log scan findings with source snippets
- Log in to Chrome Web Store
- Call Chrome Web Store APIs
- Promise guaranteed approval
- Perform malware detection
- Perform full code audit
- Build Firefox / Edge support in the MVP
- Do AI auto-fix in the MVP
- Treat Developer Dashboard fields as static findings

## Trust promise

First-screen copy must include:

> Runs locally. Your extension never leaves your browser.

Additional trust copy:

> Static preflight scan only. Not an official Chrome Web Store validator.

## User flow

1. User opens the web page.
2. User sees the local-only trust promise.
3. User drags or selects a `.zip` file.
4. Browser reads the zip locally with JSZip.
5. App locates `manifest.json`.
6. App builds a virtual file system and scanner context.
7. App runs rule checks.
8. App displays findings grouped by severity:
   - High: highly likely to cause rejection or packaging failure
   - Medium: likely to increase review scrutiny or require human confirmation
   - Low: useful review notes
9. User sees specific file paths, line numbers, snippets, reasons, recommendations, and source links.
10. User copies a Markdown report or downloads a JSON report.

## Rule IDs

| Rule ID | Severity | Check |
|---|---:|---|
| CWS001 | High | Remote hosted code risk |
| CWS002 | High | Dynamic code execution |
| CWS003 | High | Missing manifest, invalid manifest, non-MV3 manifest, or manifest not at zip root |
| CWS004 | High | Manifest references missing files |
| CWS005 | High | Unsafe extension CSP |
| CWS006 | Medium | Broad host permissions |
| CWS007 | Medium | Sensitive Chrome API permissions |
| CWS008 | Medium | Privacy disclosure review needed |
| CWS009 | Medium | Icon missing or icon path missing |
| CWS010 | Low | Remote URL found; manual review needed |

## High-accuracy MVP rule boundaries

1. If `manifest.json` is not in the zip root, report High: likely packaging mistake.
2. Do not classify every `https://` URL as High.
3. Classify as CWS001 High only when the URL appears to load or execute remote code:
   - HTML `<script src="https://...">`
   - JS `importScripts("https://...")`
   - JS static or dynamic import from remote `.js` / `.mjs`
   - JS dynamic script element with remote `.js` / `.mjs`
   - remote `.wasm` loaded through WebAssembly execution paths
4. Local `.wasm` files are not automatically High.
5. Do not classify `wasm-unsafe-eval` as dangerous by itself.
6. `unsafe-eval` in extension page CSP is High.
7. Privacy policy checks are reminders only, not automatic violation claims.
8. Dashboard listing fields are manual checklist items, not static scan findings.
9. Sensitive permissions are Medium review risks, not automatic rejection claims.
10. MVP icon check only verifies path existence; actual pixel-size inspection is P1.

## Finding data structure

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

## Success metrics

First two weeks focus on demand validation, not revenue.

- Real users upload extension zip files
- Search users land on the page
- Users copy Markdown reports or download JSON reports
- Developers report false positives / false negatives
- Users request CLI or GitHub Action versions

## Stop conditions

- Almost no real scans after two weeks
- Users only browse but do not upload zips
- Users say official docs or existing tools are enough
- Search has no impressions
- False positives are severe enough to reduce trust

## MVP development plan

| Day | Task |
|---|---|
| Day 1 | Vite project, upload zone, JSZip parsing, manifest discovery |
| Day 2 | Manifest checks, file reference checks, icon path checks |
| Day 3 | JS / HTML / CSP scanning |
| Day 4 | Permissions, privacy reminders, remote URL classification |
| Day 5 | Report UI, Markdown copy, JSON download |
| Day 6 | Fixtures, mobile polish, SEO copy |
| Day 7 | Deploy, publish, gather feedback |

## Initial SEO pages

1. Chrome Web Store Rejection Checker
2. Fix "Blue Argon" Remote Hosted Code Rejection in Manifest V3
3. Chrome Extension eval() Rejection Fix
4. Manifest V3 Pre-Submission Checklist
5. Chrome Extension Privacy Policy Requirements
6. Chrome Extension Host Permissions Too Broad

## Official references

- Remote hosted code: https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code
- Manifest CSP: https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy
- Manifest reference: https://developer.chrome.com/docs/extensions/reference/manifest
- Chrome Web Store Program Policies: https://developer.chrome.com/docs/webstore/program-policies/policies
- Prepare your extension: https://developer.chrome.com/docs/webstore/publish/preparing
