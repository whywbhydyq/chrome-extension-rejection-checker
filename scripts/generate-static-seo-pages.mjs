import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const siteUrl = 'https://chrome-extension-rejection-checker.vercel.app'

const pages = [
  {
    path: '/chrome-web-store-rejection-checker',
    title: 'Free local Chrome Web Store rejection checker – Chrome Extension Rejection Checker',
    description: 'Scan a Chrome extension ZIP locally before submission and catch common Manifest V3 rejection risks without uploading source code.',
    faqs: [
      { question: 'Is this an official Chrome Web Store validator?', answer: 'No. It is a local static preflight checker for common package-level rejection risks. Chrome Web Store review can include additional policy, metadata, privacy, and behavior checks.' },
      { question: 'Should I scan source code or the release ZIP?', answer: 'Scan the release ZIP. Chrome Web Store reviews the submitted package, so bundler output and packaging mistakes matter.' },
      { question: 'Does the scanner upload extension files?', answer: 'No. The ZIP is read in the browser. Do not add analytics that sends file paths, snippets, manifest content, or source code.' },
    ],
  },
  {
    path: '/manifest-v3-pre-submission-checklist',
    title: 'Manifest V3 pre-submission checklist for Chrome extensions – Chrome Extension Rejection Checker',
    description: 'Check that manifest.json is valid, at the ZIP root, uses Manifest V3, and references files that actually exist in your package.',
    faqs: [
      { question: 'Why does ZIP root packaging matter?', answer: 'Chrome Web Store evaluates the submitted package. If manifest.json is nested inside a folder instead of at the ZIP root, the package can fail before deeper review.' },
      { question: 'Can the scanner validate every Chrome policy?', answer: 'No. It checks static package signals. You still need to review listing metadata, privacy practices, and actual extension behavior.' },
      { question: 'Should I rerun the scanner after each fix?', answer: 'Yes. Rebuild the production ZIP after changes and scan the rebuilt package, because bundler output can change paths and generated files.' },
    ],
  },
  {
    path: '/fix-remote-hosted-code-manifest-v3',
    title: 'Fix remotely hosted code issues in Manifest V3 extensions – Chrome Extension Rejection Checker',
    description: 'Find remote script tags, importScripts calls, remote JavaScript imports, remote WebAssembly execution paths, and remote JS URL assignments.',
    faqs: [
      { question: 'Are all remote URLs forbidden?', answer: 'No. Remote data, images, and API endpoints can be legitimate. The high-risk pattern is loading and executing remote JavaScript or WebAssembly as extension code.' },
      { question: 'Can I use a CDN for third-party libraries?', answer: 'For extension code, bundle the library into the submitted package instead of loading it from a CDN at runtime.' },
      { question: 'What should I scan after bundling?', answer: 'Scan the final production ZIP and verify that extension pages and service workers reference local bundled files.' },
    ],
  },
  {
    path: '/chrome-extension-eval-rejection-fix',
    title: 'Chrome extension eval() and dynamic code rejection fix – Chrome Extension Rejection Checker',
    description: 'Find eval, new Function, and string-based timers that can trigger Chrome extension CSP and review problems.',
    faqs: [
      { question: 'Does every eval occurrence cause rejection?', answer: 'The scanner treats eval as high risk because it is commonly incompatible with extension CSP and review expectations. Review and remove it when possible.' },
      { question: 'Can minified vendor code contain dynamic execution?', answer: 'Yes. Scan the final ZIP because bundled dependencies can introduce eval-like patterns that are not obvious in your own source files.' },
      { question: 'What is the safest replacement?', answer: 'Use explicit local functions, static imports, command maps, and structured data. Avoid constructing executable code from strings.' },
    ],
  },
  {
    path: '/chrome-extension-host-permissions-privacy-review',
    title: 'Chrome extension host permissions and privacy review checklist – Chrome Extension Rejection Checker',
    description: 'Review broad host permissions, sensitive Chrome APIs, privacy disclosure reminders, and Developer Dashboard fields before publishing.',
    faqs: [
      { question: 'Are broad host permissions always wrong?', answer: 'No. They may be valid for some extensions, but they increase review scrutiny and user warning impact. Use the narrowest scope that supports the single purpose.' },
      { question: 'Can the scanner inspect Developer Dashboard disclosures?', answer: 'No. It only reads the ZIP. You must separately check privacy fields, listing copy, and reviewer notes in the Chrome Web Store dashboard.' },
      { question: 'What should I do when a sensitive permission is required?', answer: 'Keep it, but document why it is necessary, make the user-facing behavior clear, and ensure privacy disclosures match actual data use.' },
    ],
  },
]

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function createFaqSchema(page) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }, null, 6)
}

function replaceOrInsertHeadTag(html, matcher, replacement) {
  if (matcher.test(html)) return html.replace(matcher, replacement)
  return html.replace('</head>', `    ${replacement}\n  </head>`)
}

function replaceFaqSchema(html, page) {
  const marker = /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "FAQPage",[\s\S]*?\n    <\/script>/
  const schema = `    <script type="application/ld+json">\n      ${createFaqSchema(page)}\n    </script>`
  return replaceOrInsertHeadTag(html, marker, schema)
}

function replaceMeta(html, page) {
  const canonical = `${siteUrl}${page.path}`
  const escapedTitle = escapeHtml(page.title)
  const escapedDescription = escapeHtml(page.description)
  const escapedCanonical = escapeHtml(canonical)

  let nextHtml = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapedTitle}</title>`)

  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bname="description")[^>]*>/,
    `<meta name="description" content="${escapedDescription}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<link\b(?=[^>]*\brel="canonical")[^>]*>/,
    `<link rel="canonical" href="${escapedCanonical}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty="og:url")[^>]*>/,
    `<meta property="og:url" content="${escapedCanonical}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty="og:title")[^>]*>/,
    `<meta property="og:title" content="${escapedTitle}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty="og:description")[^>]*>/,
    `<meta property="og:description" content="${escapedDescription}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bname="twitter:title")[^>]*>/,
    `<meta name="twitter:title" content="${escapedTitle}" />`,
  )
  nextHtml = replaceOrInsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bname="twitter:description")[^>]*>/,
    `<meta name="twitter:description" content="${escapedDescription}" />`,
  )

  return replaceFaqSchema(nextHtml, page)
}

const templatePath = join(process.cwd(), 'dist', 'index.html')
const template = await readFile(templatePath, 'utf8')

for (const page of pages) {
  const outputPath = join(process.cwd(), 'dist', page.path, 'index.html')
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, replaceMeta(template, page))
}

console.log(`Generated ${pages.length} static SEO page shells.`)
