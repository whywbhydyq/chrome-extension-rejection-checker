export type SeoPageData = {
  path: string
  title: string
  eyebrow: string
  description: string
  sections: Array<{ heading: string; body: string }>
  checklist: string[]
  examples: Array<{ title: string; body: string }>
  faqs: Array<{ question: string; answer: string }>
  relatedLinks: Array<{ href: string; label: string }>
}

export const seoPages: SeoPageData[] = [
  {
    path: '/chrome-web-store-rejection-checker',
    eyebrow: 'Chrome Web Store rejection checker',
    title: 'Free local Chrome Web Store rejection checker',
    description: 'Scan a Chrome extension ZIP locally before submission and catch common Manifest V3 rejection risks without uploading source code.',
    sections: [
      { heading: 'What the checker scans', body: 'The scanner reads manifest.json, manifest file references, extension pages, JavaScript files, CSP, permissions, icon declarations, and privacy-review signals. It is built for the final production ZIP, not only the source folder.' },
      { heading: 'When to use it', body: 'Use it before uploading a new release, after switching to Manifest V3, after changing bundler output, or after receiving a vague Chrome Web Store rejection email that does not point to one exact file.' },
      { heading: 'What it does not promise', body: 'This is not an official Chrome Web Store validator. It does not guarantee approval, detect malware, inspect Developer Dashboard fields, or verify runtime behavior that only happens after user interaction.' },
    ],
    checklist: [
      'Build the same ZIP that you plan to submit to Chrome Web Store.',
      'Confirm manifest.json is at the ZIP root, not inside a nested project folder.',
      'Run the local scanner and fix High findings before reviewing Medium and Low notes.',
      'Rebuild the production ZIP after each fix and scan the rebuilt package again.',
      'Review Chrome Web Store listing copy, privacy disclosures, screenshots, and reviewer notes separately.',
    ],
    examples: [
      { title: 'Remote script in an extension page', body: 'A popup.html file loads a script from a CDN. The scanner flags the remote script because executable code should be bundled into the extension package.' },
      { title: 'Nested manifest packaging mistake', body: 'The ZIP contains my-extension/manifest.json instead of manifest.json at the root. The scanner reports this as a High packaging risk.' },
      { title: 'Broad host permissions', body: 'A manifest requests <all_urls>. The scanner asks you to verify whether narrower host patterns or optional permissions can support the same single purpose.' },
    ],
    faqs: [
      { question: 'Is this an official Chrome Web Store validator?', answer: 'No. It is a local static preflight checker for common package-level rejection risks. Chrome Web Store review can include additional policy, metadata, privacy, and behavior checks.' },
      { question: 'Should I scan source code or the release ZIP?', answer: 'Scan the release ZIP. Chrome Web Store reviews the submitted package, so bundler output and packaging mistakes matter.' },
      { question: 'Does the scanner upload extension files?', answer: 'No. The ZIP is read in the browser. Do not add analytics that sends file paths, snippets, manifest content, or source code.' },
    ],
    relatedLinks: [
      { href: '/manifest-v3-pre-submission-checklist', label: 'Manifest V3 pre-submission checklist' },
      { href: '/fix-remote-hosted-code-manifest-v3', label: 'Fix remote hosted code in Manifest V3' },
      { href: '/chrome-extension-eval-rejection-fix', label: 'Fix eval and dynamic code rejection' },
    ],
  },
  {
    path: '/manifest-v3-pre-submission-checklist',
    eyebrow: 'Manifest V3 checklist',
    title: 'Manifest V3 pre-submission checklist for Chrome extensions',
    description: 'Check that manifest.json is valid, at the ZIP root, uses Manifest V3, and references files that actually exist in your package.',
    sections: [
      { heading: 'Package the ZIP correctly', body: 'Chrome Web Store expects manifest.json at the ZIP root. Do not zip the parent project folder unless manifest.json is directly inside that root. Scan the exact release ZIP, not a development folder.' },
      { heading: 'Validate manifest references', body: 'Background service workers, popup files, options pages, content scripts, icons, web accessible resources, and DNR rules should all point to files that exist in the submitted ZIP.' },
      { heading: 'Review permissions and CSP', body: 'Broad host permissions, sensitive APIs, and unsafe CSP declarations should be minimized and justified before submission. Many valid extensions still need clear policy explanations.' },
    ],
    checklist: [
      'Set manifest_version to 3.',
      'Place manifest.json at the ZIP root.',
      'Verify background service worker paths exist in the ZIP.',
      'Verify action popup, options page, content scripts, icons, and web accessible resources exist.',
      'Remove unused permissions and narrow host permissions when possible.',
      'Check extension page CSP for unsafe-eval and remote script assumptions.',
      'Prepare privacy disclosure and single-purpose explanation before submission.',
    ],
    examples: [
      { title: 'Missing popup file', body: 'manifest.json references popup.html, but the production build outputs popup/index.html. The scanner reports the missing reference so the manifest or build path can be corrected.' },
      { title: 'Missing icon path', body: 'The manifest references icons/icon128.png, but the ZIP contains assets/icon128.png. The scanner flags the path mismatch before upload.' },
      { title: 'Development-only files', body: 'A local build works because source files exist, but the submitted ZIP lacks generated content script files. Scan the release ZIP to catch this mismatch.' },
    ],
    faqs: [
      { question: 'Why does ZIP root packaging matter?', answer: 'Chrome Web Store evaluates the submitted package. If manifest.json is nested inside a folder instead of at the ZIP root, the package can fail before deeper review.' },
      { question: 'Can the scanner validate every Chrome policy?', answer: 'No. It checks static package signals. You still need to review listing metadata, privacy practices, and actual extension behavior.' },
      { question: 'Should I rerun the scanner after each fix?', answer: 'Yes. Rebuild the production ZIP after changes and scan the rebuilt package, because bundler output can change paths and generated files.' },
    ],
    relatedLinks: [
      { href: '/chrome-web-store-rejection-checker', label: 'Chrome Web Store rejection checker' },
      { href: '/chrome-extension-host-permissions-privacy-review', label: 'Host permissions and privacy review checklist' },
      { href: '/chrome-extension-eval-rejection-fix', label: 'Fix eval and dynamic code rejection' },
    ],
  },
  {
    path: '/fix-remote-hosted-code-manifest-v3',
    eyebrow: 'Remote hosted code fix',
    title: 'Fix remotely hosted code issues in Manifest V3 extensions',
    description: 'Find remote script tags, importScripts calls, remote JavaScript imports, remote WebAssembly execution paths, and remote JS URL assignments.',
    sections: [
      { heading: 'What counts as remote hosted code risk', body: 'Remote JavaScript or WebAssembly that is loaded and executed by the extension is a high-risk pattern for Manifest V3 review. The fix is usually to bundle executable code into the submitted package.' },
      { heading: 'What is usually safe', body: 'Remote API endpoints, image URLs, documentation links, and JSON data URLs are not automatically executable code. They should still be reviewed so executable code is not being fetched indirectly.' },
      { heading: 'How to fix it', body: 'Replace CDN scripts, remote dynamic imports, remote importScripts calls, and remote WebAssembly execution paths with bundled files. Fetch remote services as data, then process that data with local code.' },
    ],
    checklist: [
      'Search extension HTML for remote script src values.',
      'Search service workers and content scripts for importScripts with remote URLs.',
      'Replace remote dynamic imports with bundled modules.',
      'Bundle WebAssembly files when they are executable extension logic.',
      'Keep remote API calls as data requests, not code loaders.',
      'Rebuild and scan the final ZIP again.',
    ],
    examples: [
      { title: 'CDN script in popup.html', body: 'A popup loads https://cdn.example.com/widget.js. Bundle the widget script into the extension and reference the local file instead.' },
      { title: 'Remote dynamic import', body: 'A background script imports a module from an HTTPS URL. Replace it with a local import that the bundler includes in the release package.' },
      { title: 'Remote WebAssembly execution', body: 'If WebAssembly is part of executable extension logic, include the wasm file in the extension ZIP and load it from extension resources.' },
    ],
    faqs: [
      { question: 'Are all remote URLs forbidden?', answer: 'No. Remote data, images, and API endpoints can be legitimate. The high-risk pattern is loading and executing remote JavaScript or WebAssembly as extension code.' },
      { question: 'Can I use a CDN for third-party libraries?', answer: 'For extension code, bundle the library into the submitted package instead of loading it from a CDN at runtime.' },
      { question: 'What should I scan after bundling?', answer: 'Scan the final production ZIP and verify that extension pages and service workers reference local bundled files.' },
    ],
    relatedLinks: [
      { href: '/chrome-web-store-rejection-checker', label: 'Run the local ZIP scanner' },
      { href: '/manifest-v3-pre-submission-checklist', label: 'Manifest V3 pre-submission checklist' },
      { href: '/chrome-extension-eval-rejection-fix', label: 'Fix eval and dynamic code rejection' },
    ],
  },
  {
    path: '/chrome-extension-eval-rejection-fix',
    eyebrow: 'Dynamic code execution',
    title: 'Chrome extension eval() and dynamic code rejection fix',
    description: 'Find eval, new Function, and string-based timers that can trigger Chrome extension CSP and review problems.',
    sections: [
      { heading: 'Why eval is risky', body: 'String-code execution makes extension behavior harder to review and often conflicts with extension page CSP restrictions. It can also hide remote-code-like behavior from a static review.' },
      { heading: 'Patterns to replace', body: 'Replace eval, Function constructors, and string-based setTimeout or setInterval calls with normal functions, modules, command maps, JSON parsing, or structured data.' },
      { heading: 'How this scanner helps', body: 'The report shows the file, line, snippet, reason, and recommendation so developers can quickly remove dynamic code execution patterns from the submitted ZIP.' },
    ],
    checklist: [
      'Search for eval calls in background, popup, options, and content scripts.',
      'Replace new Function with explicit functions or a command map.',
      'Replace string-based setTimeout and setInterval with function callbacks.',
      'Check bundled vendor files for dynamic-code helpers.',
      'Rebuild and scan the production ZIP again.',
    ],
    examples: [
      { title: 'Command string passed to eval', body: 'Replace eval(command) with a map such as actions[commandName](payload), where commandName is validated and action functions are bundled.' },
      { title: 'new Function template evaluator', body: 'Replace runtime function construction with precompiled templates, safe expression parsing, or a limited set of local handlers.' },
      { title: 'String timer callback', body: 'Replace setTimeout("runTask()", 1000) with setTimeout(() => runTask(), 1000).' },
    ],
    faqs: [
      { question: 'Does every eval occurrence cause rejection?', answer: 'The scanner treats eval as high risk because it is commonly incompatible with extension CSP and review expectations. Review and remove it when possible.' },
      { question: 'Can minified vendor code contain dynamic execution?', answer: 'Yes. Scan the final ZIP because bundled dependencies can introduce eval-like patterns that are not obvious in your own source files.' },
      { question: 'What is the safest replacement?', answer: 'Use explicit local functions, static imports, command maps, and structured data. Avoid constructing executable code from strings.' },
    ],
    relatedLinks: [
      { href: '/chrome-web-store-rejection-checker', label: 'Run the local ZIP scanner' },
      { href: '/fix-remote-hosted-code-manifest-v3', label: 'Fix remote hosted code in Manifest V3' },
      { href: '/manifest-v3-pre-submission-checklist', label: 'Manifest V3 pre-submission checklist' },
    ],
  },
  {
    path: '/chrome-extension-host-permissions-privacy-review',
    eyebrow: 'Permissions and privacy review',
    title: 'Chrome extension host permissions and privacy review checklist',
    description: 'Review broad host permissions, sensitive Chrome APIs, privacy disclosure reminders, and Developer Dashboard fields before publishing.',
    sections: [
      { heading: 'Broad host permissions', body: 'Patterns such as <all_urls> and *://*/* may increase review scrutiny and user warning impact. Use narrower host patterns, optional permissions, or activeTab when they fit the extension purpose.' },
      { heading: 'Sensitive APIs', body: 'Permissions such as tabs, cookies, history, debugger, identity, webRequest, and scripting should support the extension single purpose and should be explained clearly in user-facing copy.' },
      { heading: 'Privacy disclosure reminder', body: 'The ZIP scanner cannot inspect Developer Dashboard privacy fields, so it provides reminders when permissions may involve user data, browsing activity, authentication, or host access.' },
    ],
    checklist: [
      'Remove unused permissions from manifest.json.',
      'Narrow host permissions to required domains when possible.',
      'Use optional permissions for features users can enable later.',
      'Check whether activeTab can replace broad host access.',
      'Prepare a privacy policy if the extension handles user data.',
      'Make Developer Dashboard data-use disclosures match the extension behavior.',
      'Add reviewer notes for permissions that are not obvious from the UI.',
    ],
    examples: [
      { title: 'Unnecessary <all_urls>', body: 'A screenshot helper may only need access to the current active tab after user action, not every website all the time.' },
      { title: 'Sensitive API without explanation', body: 'A history or cookies permission can be valid, but the listing and privacy disclosures should explain why the permission is necessary.' },
      { title: 'Broad scripting access', body: 'If scripting is only used on one product domain, narrow host permissions to that domain instead of all HTTP and HTTPS pages.' },
    ],
    faqs: [
      { question: 'Are broad host permissions always wrong?', answer: 'No. They may be valid for some extensions, but they increase review scrutiny and user warning impact. Use the narrowest scope that supports the single purpose.' },
      { question: 'Can the scanner inspect Developer Dashboard disclosures?', answer: 'No. It only reads the ZIP. You must separately check privacy fields, listing copy, and reviewer notes in the Chrome Web Store dashboard.' },
      { question: 'What should I do when a sensitive permission is required?', answer: 'Keep it, but document why it is necessary, make the user-facing behavior clear, and ensure privacy disclosures match actual data use.' },
    ],
    relatedLinks: [
      { href: '/chrome-web-store-rejection-checker', label: 'Run the local ZIP scanner' },
      { href: '/manifest-v3-pre-submission-checklist', label: 'Manifest V3 pre-submission checklist' },
      { href: '/fix-remote-hosted-code-manifest-v3', label: 'Fix remote hosted code in Manifest V3' },
    ],
  },
]
