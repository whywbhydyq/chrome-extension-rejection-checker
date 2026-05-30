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
| Manifest packaging | CWS003, CWS004 | Missing manifest, nested manifest, non-MV3 manifest, invalid manifest JSON, missing referenced files | Does not validate every manifest schema field or every Chrome Web Store dashboard field |
| Remote hosted code | CWS001, CWS010 | Remote script tags, importScripts, static imports, dynamic imports, Worker, SharedWorker, serviceWorker.register, worklet addModule, remote WASM streaming, remote executable URL assignments | Dynamic URL construction and interpreter-style remote command systems can require manual review |
| Dynamic code execution | CWS002 | eval, Function constructor, string-based setTimeout, string-based setInterval | Minified vendor bundles can require manual inspection to decide whether a flagged pattern is reachable |
| Extension CSP | CWS005 | unsafe-eval, remote script-src, remote worker-src, missing object-src on custom extension_pages CSP, unsafe object-src values | Does not emulate Chrome's full CSP parser or all extension page execution contexts |
| Permissions | CWS006, CWS007 | Broad host patterns and sensitive Chrome API permissions | Valid permissions can still be policy-compliant with narrow purpose and clear disclosure |
| Privacy review | CWS008 | User-data-related permissions and broad host access reminders | Cannot inspect Developer Dashboard privacy fields or runtime data handling |
| Icons and assets | CWS009 | Missing icons, missing icon files, SVG/PNG dimension mismatch | Does not perform image quality, branding, or store-listing screenshot review |
| Browser safety limits | ZIP_* | Oversized ZIPs, too many entries, very large expanded ZIPs, unreadable or skipped files | Partial scans require manual review of skipped files before submission |

## Release workflow

1. Scan the final production ZIP.
2. Fix High findings first.
3. Rebuild the production ZIP.
4. Scan the rebuilt ZIP again.
5. Review Medium and Low findings.
6. Review Developer Dashboard privacy fields, listing copy, screenshots, reviewer notes, policy disclosures, and runtime behavior separately.
