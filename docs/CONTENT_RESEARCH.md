# Chrome Extension Rejection Checker Research Notes

Last updated: 2026-05-30

This file records the source and search-intent research used to shape the current content modules. It is an internal publishing aid, not a guarantee that Chrome Web Store will approve any extension.

## Page task

The main page is an audit-report tool page. Its first task is not to explain Chrome Web Store policy in long-form prose. The first task is:

1. Upload the final production Chrome extension ZIP.
2. Run a local static scan in the browser.
3. Review High, Medium, Low, and scan-limit notes.
4. Copy or download a repair report.
5. Use guide pages and official docs for manual review before resubmission.

Long explanations, policy sources, FAQs, and related guides should stay below the tool workbench or on standalone guide pages.

## Official source map

| Source | URL | Use in this project |
|---|---|---|
| Chrome remote hosted code guidance | https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code | Defines remotely hosted code as browser-executed JavaScript or WebAssembly loaded from outside the extension package. Supports RHC findings, Blue Argon guide, and scanner copy. |
| Manifest content security policy | https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy | Defines extension_pages and sandbox CSP policies, default policies, and minimum MV3 CSP. Supports CSP findings and eval guidance. |
| Manifest sandbox | https://developer.chrome.com/docs/extensions/reference/manifest/sandbox | Documents sandbox.pages and sandbox CSP restrictions, including the required sandbox directive and disallowed allow-same-origin token. |
| Prepare your extension | https://developer.chrome.com/docs/webstore/prepare | Supports ZIP packaging guidance and the root manifest finding. |
| Troubleshooting Chrome Web Store violations | https://developer.chrome.com/docs/webstore/troubleshooting | Supports rejection workflow pages and the warning that this scanner does not replace reviewer decisions. |
| Fill out the privacy fields | https://developer.chrome.com/docs/webstore/cws-dashboard-privacy | Supports privacy-practices, single-purpose, and permission-justification reminders. |
| Developer Program Policies | https://developer.chrome.com/docs/webstore/program-policies/policies | Supports broader user-data, transparency, and policy boundary copy. |
| Permissions policy | https://developer.chrome.com/docs/webstore/program-policies/permissions | Supports narrowest-permissions reminders and broad-permission review. |
| Declare permissions | https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions | Supports permission declaration and optional-permission explanations. |
| Permission warning guidelines | https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings | Supports warnings about install-time and runtime permission prompts. |
| activeTab permission | https://developer.chrome.com/docs/extensions/develop/concepts/activeTab | Supports guidance that activeTab can sometimes reduce broad host access. |
| Update your Chrome Web Store item | https://developer.chrome.com/docs/webstore/update | Supports resubmission guidance: upload a new ZIP and increment version when code/package assets change. |

## SERP and community signal summary

These signals are not used as official policy sources. They explain user intent and content positioning.

| Query / topic | Observed result pattern | User intent | Content decision |
|---|---|---|---|
| chrome extension rejection checker | Mixed results; not dominated by an official validator | Find a tool to preflight a ZIP before or after rejection | Homepage should be the main tool page. Do not split a synonym URL. |
| Chrome Web Store rejection checker | Official troubleshooting, guide content, and forum discussions | Read rejection email, identify probable category, resubmit | Guide page should support the homepage, not compete with it. |
| Blue Argon Chrome extension rejection | Chromium Groups, official RHC docs, StackOverflow/GitHub issues | Understand Blue Argon and find remote hosted code | Existing Blue Argon guide should point back to local ZIP scan and official RHC docs. |
| fix remote hosted code Manifest V3 | Official RHC docs and developer cases | Replace remote executable code with packaged code | Existing RHC guide is justified; no extra URL needed. |
| Chrome extension unsafe-eval Manifest V3 | Official CSP docs, StackOverflow, GitHub issues | Fix eval, new Function, WASM/CSP build issues | Existing eval/dynamic code guide is justified. |
| Chrome extension host permissions privacy review | Official permissions, privacy fields, and policy docs | Minimize broad access and prepare dashboard explanations | Existing permissions/privacy page should stay checklist-based, not claim full compliance automation. |
| Chrome extension csp checker | Could overlap with general web CSP tools | Check MV3 extension_pages and sandbox CSP | Do not create a standalone page until GSC/Bing shows repeated intent. |
| chrome extension zip scanner | Logical synonym of the homepage | Upload ZIP for local scanning | Keep as homepage copy/FAQ, not a new URL. |
| chrome extension missing file checker | Subtask under packaging/manifest | Catch manifest references to missing build files | Keep inside MV3 checklist, not a new URL. |

## Keyword evidence grading

No first-party GSC/Bing/Keyword Planner data was provided. Current decisions therefore use C/D-level evidence only.

| Keyword | Evidence | Action |
|---|---|---|
| chrome extension rejection checker | C: manually observed search pattern and page intent | Strengthen `/` homepage. |
| chrome web store rejection checker | C: official troubleshooting + user/forum intent | Keep `/chrome-web-store-rejection-checker` as guide. |
| remote hosted code manifest v3 | C: official doc and repeated community cases | Keep `/fix-remote-hosted-code-manifest-v3`. |
| blue argon chrome extension | C: official RHC relation and Chromium Groups cases | Keep `/blue-argon-chrome-extension-error`. |
| chrome extension unsafe eval | C: official CSP docs and developer Q&A | Keep `/chrome-extension-eval-rejection-fix`. |
| host permissions privacy review | C: official policy docs | Keep `/chrome-extension-host-permissions-privacy-review`. |
| chrome extension csp checker | D: logical candidate only | Do not create a new URL yet. |
| chrome extension zip scanner | D: logical synonym | Keep on homepage only. |
| chrome extension missing file checker | D: subtask | Keep as MV3 checklist module. |

## Content boundaries

Do:

- Keep the homepage as a tool workbench.
- Put official source links below the workbench, in how-it-works, and on guide pages.
- Use independent/local/static-preflight language.
- Explain that a clean report does not guarantee Chrome Web Store approval.
- Distinguish code findings from scan limits.
- Explain that downloaded reports may include paths/snippets and should not be sent to analytics.

Do not:

- Add long policy essays above the ZIP upload area.
- Claim official Chrome Web Store validation.
- Claim approval, success rates, or exhaustive compliance detection.
- Create new long-tail URLs without GSC/Bing or other search evidence.
- Treat ordinary remote JSON/API/image/CSS URLs as automatic RHC violations.
- Send ZIP names, source code, detected URLs, file paths, snippets, or scan-limit notes to analytics.

## Post-publish review plan

| Time after publish | Data to inspect | Action |
|---|---|---|
| 4 weeks | GSC impressions and clicks for homepage terms | If impressions exist but clicks are low, adjust title/description and first-screen promise before adding pages. |
| 8 weeks | Query distribution across guide pages | If Blue Argon, RHC, eval, or permission queries repeat, strengthen the matching guide page and internal links. |
| 12 weeks | Repeated unserved subtask queries | Add modules first. Create new URLs only when a query has a distinct task, a clear page shape, and does not cannibalize existing pages. |
| Any time | No impressions | Check indexing, sitemap, canonical, and internal links before writing more content. |

## Expanded research pass: content depth and intent coverage

Date: 2026-05-30

This pass expanded the guide-page content without changing the homepage workbench. The goal was to make each guide more useful as a diagnostic page while preserving the main tool path: upload final ZIP, scan locally, review findings, export a report, and then use official docs for manual review.

### Additional source observations

| Topic | Source | Observation | Content decision |
|---|---|---|---|
| Updating a submitted item | https://developer.chrome.com/docs/webstore/update | Chrome Web Store updates that change code, manifest, or packaged assets require a new ZIP upload and a larger version number. | Added resubmission copy that reminds users to scan the rebuilt ZIP and prepare a concise reviewer note after package changes. |
| Uploading a new item | https://developer.chrome.com/docs/webstore/publish | The upload flow starts with choosing a ZIP; package validity affects whether the item can proceed. | Reinforced package-level scanning and root manifest checks before policy copywriting. |
| Troubleshooting violations | https://developer.chrome.com/docs/webstore/troubleshooting | Violation IDs are human-readable categories, not exhaustive per-file diagnoses. | Added guidance to treat rejection notices as leads and to investigate the uploaded package. |
| Declare permissions | https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions | Permissions limit damage and some permissions show user warnings; optional permissions can provide more user control. | Expanded permission review content around permission-to-feature mapping and optional permissions. |
| Permission warnings | https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings | Some permissions trigger user consent warnings before install or at runtime. | Added copy that dashboard explanations and listing copy should align with requested permission behavior. |
| activeTab | https://developer.chrome.com/docs/extensions/develop/concepts/activeTab | activeTab grants temporary access after user invocation and can reduce broad persistent host access in some cases. | Added activeTab as a practical alternative to broad host patterns when behavior allows it. |
| Cross-origin requests | https://developer.chrome.com/docs/extensions/develop/concepts/network-requests | Cross-origin requests are distinct from executable remote code and depend on host permissions. | Kept remote API/data URLs as manual-review items rather than automatic high-severity RHC findings. |

### Community and SERP signal observations

| Topic | Examples | Observation | Content decision |
|---|---|---|---|
| Blue Argon | Chromium Extensions threads and StackOverflow questions | Developers often receive Blue Argon emails with only broad guidance and then need to inspect generated output. | Expanded Blue Argon page with triage order, analytics/auth SDK review, and clean-scan limits. |
| Analytics/auth SDKs | Google Groups, StackOverflow, GitHub issues for analytics SDKs and Firebase/auth-style integrations | Remote script URLs can appear through dependencies or generated output rather than obvious handwritten script tags. | Expanded RHC and Blue Argon pages to emphasize scanning final bundles and provider SDK output. |
| Unsafe eval and CSP | StackOverflow, GitHub issues involving MV3 CSP, WASM glue, and unsafe-eval errors | Developers often try to change CSP first, but MV3 extension pages cannot simply allow unsafe-eval or remote script sources. | Expanded eval page with bundler/source-map/WASM and sandbox guidance. |
| Package mismatch | Chrome Web Store update/publish docs and community rejection threads | Source intent and submitted package contents can diverge because stale files, generated workers, or source maps remain in the ZIP. | Expanded rejection and checklist pages to frame the ZIP as the review artifact. |

### Content expansion rules applied

1. Homepage remained a tool workbench and was not expanded into a long article.
2. Each guide page received practical modules after the tool CTA, not above the guide hero.
3. New copy avoids official-validator language, approval guarantees, success rates, or unsupported search-volume claims.
4. Content links users back to the scanner when the next useful action is scanning the packaged ZIP.
5. Official Chrome documentation remains the source for policy facts; community material is used only for intent and scenario evidence.
6. Scan limits, confidence labels, and manual-review wording are preserved so content does not overstate static-scan certainty.

### Current content depth target

The expanded content aims for a practical guide-page density rather than a long-form article density:

| Page type | Target visible depth | Reason |
|---|---:|---|
| Main tool homepage | Short workbench copy only | User came to scan, not read. |
| Rejection workflow guide | 600-900 words total visible guidance | Needs resubmission workflow, ZIP scan, reviewer-note guidance. |
| RHC / Blue Argon / eval guides | 600-900 words total visible guidance | Needs examples, remediation path, and manual-review boundaries. |
| Permissions / privacy guide | 600-850 words total visible guidance | Needs checklist framing without claiming full policy automation. |
| How it works | 700-1000 words total visible guidance | Needs rule coverage, limits, confidence, and official source mapping. |
| Privacy | 500-750 words total visible guidance | Needs scanner data boundary, report export boundary, and analytics boundary. |

