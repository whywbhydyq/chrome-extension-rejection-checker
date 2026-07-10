# Static rule coverage

Rules version: `2026-05-30-mv3-static-rules`

This project is an independent local preflight scanner. It is not an official Chrome Web Store validator and does not guarantee approval.

## Data boundary

The scanner reads the selected ZIP in the browser and should not transmit:

- ZIP name
- file names or file paths
- manifest content
- source snippets
- detected URLs
- package contents
- extension IDs or package names

Allowed analytics are aggregate events such as severity counts, partial-scan status, and rules version.

## Rule accuracy matrix

| Area | Rule IDs | Direct checks | Known limits |
|---|---|---|---|
| Manifest packaging | CWS003, CWS004 | Missing manifest, nested manifest, non-MV3 manifest, invalid manifest JSON, missing referenced files, remote executable manifest references, sandbox page references, leading-slash paths, wildcard paths that require manual review | Does not validate every manifest schema field or every Chrome Web Store dashboard field |
| Remote hosted code | CWS001, CWS010 | Remote script tags, importScripts, static imports, dynamic imports, Worker, SharedWorker, serviceWorker.register, worklet addModule, remote WASM streaming, remote executable URL assignments, standalone remote JS/WASM URL strings for manual review, confidence notes for likely fixture/test/doc contexts | Dynamic URL construction, comments, source maps, and interpreter-style remote command systems can require manual review |
| Dynamic code execution | CWS002 | eval, Function constructor, string-based setTimeout, string-based setInterval, string-based setImmediate, legacy tabs.executeScript code injection, DevTools inspectedWindow.eval | Minified vendor bundles can require manual inspection to decide whether a flagged pattern is reachable |
| Extension CSP | CWS005 | Manifest V3 legacy string CSP format, unsafe-eval, unsupported script-src/default-src fallback sources, unsupported worker-src fallback sources, `'none'` mixed with other sources, missing object-src on custom extension_pages CSP, unsafe object-src values, localhost development sources, sandbox CSP manual-review reminders, missing sandbox directive, sandbox `allow-same-origin` warnings | Does not fully evaluate sandbox page runtime behavior or emulate Chrome's complete CSP parser |
| Permissions | CWS006, CWS007 | Broad host patterns and sensitive Chrome API permissions | Valid permissions can still be policy-compliant with narrow purpose and clear disclosure |
| Privacy review | CWS008 | User-data-related permissions and broad host access reminders | Cannot inspect Developer Dashboard privacy fields or runtime data handling |
| Icons and assets | CWS009 | Missing icons, missing icon files, SVG/PNG dimension mismatch | Does not perform image quality, branding, or store-listing screenshot review |
| Browser safety limits | ZIP_* | Oversized ZIPs, too many entries, very large expanded ZIPs, unreadable files, skipped unknown-size text files beyond the limited core-file read budget, skipped large text files | Partial scans are reported separately from code-policy findings and require manual review of skipped files before submission |

## Release workflow

1. Scan the final production ZIP.
2. Fix High findings first.
3. Rebuild the production ZIP.
4. Scan the rebuilt ZIP again.
5. Review Medium and Low findings.
6. Review Developer Dashboard privacy fields, listing copy, screenshots, reviewer notes, policy disclosures, and runtime behavior separately.

## Official documentation mapped to rules

| Official source | Used for |
|---|---|
| https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code | RHC definitions, Blue Argon context, JS/WASM executable code boundary, compiled package search guidance |
| https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy | extension_pages CSP, sandbox CSP distinction, default policy, minimum MV3 CSP, unsafe-eval boundary |
| https://developer.chrome.com/docs/extensions/reference/manifest/sandbox | sandbox.pages, required sandbox directive, disallowed allow-same-origin token |
| https://developer.chrome.com/docs/webstore/prepare | ZIP packaging and root manifest requirement |
| https://developer.chrome.com/docs/webstore/troubleshooting | Rejection workflow and violation-reference interpretation |
| https://developer.chrome.com/docs/webstore/cws-dashboard-privacy | Privacy practices tab, single purpose, permission justifications |
| https://developer.chrome.com/docs/webstore/program-policies/permissions | Narrowest-permissions principle and broad-permission review context |
| https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings | Permission warning context for install-time and runtime prompts |
| https://developer.chrome.com/docs/extensions/develop/concepts/activeTab | Temporary user-invoked access alternative for some broad host access cases |

## Content expansion source alignment

The guide-page copy is intentionally tied to the same rule families as the scanner. Remote hosted code pages use the Chrome RHC guidance; CSP pages use the manifest CSP and sandbox documentation; packaging pages use Chrome Web Store prepare, publish, and update documentation; permission pages use Chrome permissions, permission warnings, activeTab, and privacy-practices documentation. Community reports are used only to explain user intent and common investigation scenarios, not as policy authority.
