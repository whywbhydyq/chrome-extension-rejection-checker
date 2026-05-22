export type SeoPageData = {
  path: string
  title: string
  eyebrow: string
  description: string
  sections: Array<{ heading: string; body: string }>
}

export const seoPages: SeoPageData[] = [
  {
    path: '/chrome-web-store-rejection-checker',
    eyebrow: 'Chrome Web Store rejection checker',
    title: 'Free local Chrome Web Store rejection checker',
    description: 'Scan a Chrome extension ZIP locally before submission and catch common Manifest V3 rejection risks without uploading source code.',
    sections: [
      { heading: 'What the checker scans', body: 'The scanner reads manifest.json, manifest file references, extension pages, JavaScript files, CSP, permissions, icon declarations, and privacy-review signals.' },
      { heading: 'What it does not promise', body: 'This is not an official Chrome Web Store validator. It does not guarantee approval, detect malware, or inspect Developer Dashboard fields.' },
      { heading: 'Best use case', body: 'Use it as a fast smoke check before uploading a release ZIP or after receiving a vague rejection email.' },
    ],
  },
  {
    path: '/manifest-v3-pre-submission-checklist',
    eyebrow: 'Manifest V3 checklist',
    title: 'Manifest V3 pre-submission checklist for Chrome extensions',
    description: 'Check that manifest.json is valid, at the ZIP root, uses Manifest V3, and references files that actually exist in your package.',
    sections: [
      { heading: 'Package the ZIP correctly', body: 'Chrome Web Store expects manifest.json at the ZIP root. Do not zip the parent project folder unless manifest.json is directly inside that root.' },
      { heading: 'Validate manifest references', body: 'Background service workers, popup files, options pages, content scripts, icons, web accessible resources, and DNR rules should all point to files in the ZIP.' },
      { heading: 'Review permissions', body: 'Broad host permissions and sensitive APIs may be valid, but they should be minimized and clearly justified.' },
    ],
  },
  {
    path: '/fix-remote-hosted-code-manifest-v3',
    eyebrow: 'Remote hosted code fix',
    title: 'Fix remotely hosted code issues in Manifest V3 extensions',
    description: 'Find remote script tags, importScripts calls, remote JavaScript imports, remote WebAssembly execution paths, and remote JS URL assignments.',
    sections: [
      { heading: 'What counts as remote hosted code risk', body: 'Remote JavaScript or WebAssembly that is loaded and executed by the extension is a high-risk pattern for Manifest V3 review.' },
      { heading: 'What is usually safe', body: 'Remote API endpoints, image URLs, documentation links, and JSON data URLs are not automatically executable code, but should still be reviewed.' },
      { heading: 'How to fix it', body: 'Bundle executable code inside the submitted extension package and load data from remote APIs only as data.' },
    ],
  },
  {
    path: '/chrome-extension-eval-rejection-fix',
    eyebrow: 'Dynamic code execution',
    title: 'Chrome extension eval() and dynamic code rejection fix',
    description: 'Find eval, new Function, and string-based timers that can trigger Chrome extension CSP and review problems.',
    sections: [
      { heading: 'Why eval is risky', body: 'String-code execution makes extension behavior harder to review and often conflicts with extension page CSP restrictions.' },
      { heading: 'Patterns to replace', body: 'Replace eval, Function constructors, and string-based setTimeout or setInterval calls with normal functions, modules, and structured data.' },
      { heading: 'How this scanner helps', body: 'The report shows the file, line, snippet, reason, and recommendation so developers can quickly remove dynamic code execution patterns.' },
    ],
  },
  {
    path: '/chrome-extension-host-permissions-privacy-review',
    eyebrow: 'Permissions and privacy review',
    title: 'Chrome extension host permissions and privacy review checklist',
    description: 'Review broad host permissions, sensitive Chrome APIs, privacy disclosure reminders, and Developer Dashboard fields before publishing.',
    sections: [
      { heading: 'Broad host permissions', body: 'Patterns such as <all_urls> and *://*/* may increase review scrutiny and user warning impact. Use narrower host patterns when possible.' },
      { heading: 'Sensitive APIs', body: 'Permissions such as tabs, cookies, history, debugger, identity, webRequest, and scripting should support the extension single purpose.' },
      { heading: 'Privacy disclosure reminder', body: 'The ZIP scanner cannot inspect Developer Dashboard privacy fields, so it provides reminders when permissions may involve user data or browsing activity.' },
    ],
  },
]
