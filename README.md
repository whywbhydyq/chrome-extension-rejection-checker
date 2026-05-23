# Chrome Extension Rejection Checker

Free local Chrome Web Store preflight scanner for Manifest V3 extension `.zip` files.

Production URL:

https://chrome-extension-rejection-checker.vercel.app/

## Trust promise

Runs locally. Your extension never leaves your browser.

This is a static preflight scan only. It is not an official Chrome Web Store validator and cannot guarantee approval.

## MVP checks

- Manifest missing / invalid / not MV3
- Manifest not in zip root
- Manifest references missing files
- Remote hosted code risks
- Dynamic string-code execution risks
- Unsafe extension CSP
- Broad host permissions
- Sensitive Chrome API permissions
- Privacy disclosure review reminders
- Icon path existence
- Remote URL manual review list

## SEO and trust pages

Route content is stored in `src/pages/seoPagesData.json` and reused by both the React app and the static SEO generator. This prevents the rendered React page and generated HTML source from drifting.

Generated static routes:

- `/chrome-web-store-rejection-checker`
- `/manifest-v3-pre-submission-checklist`
- `/fix-remote-hosted-code-manifest-v3`
- `/blue-argon-chrome-extension-error`
- `/chrome-extension-eval-rejection-fix`
- `/chrome-extension-host-permissions-privacy-review`
- `/privacy`
- `/how-it-works`

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The build command runs:

```bash
tsc -b && vite build && node scripts/generate-static-seo-pages.mjs
```

The final step generates route-specific static HTML pages under `dist/`, including visible body content, page-specific title, description, canonical, Open Graph, Twitter, SoftwareApplication/WebApplication JSON-LD, and FAQPage JSON-LD metadata.

## Generate static SEO pages only

After `vite build` has created `dist/index.html`, you can regenerate the SEO route HTML files manually:

```bash
npm run generate:seo-pages
```

## Generate local archives

```bash
npm install
npm run build:archives
```

This creates:

- `src.zip`
- `fixtures.zip`
- `extension-test.zip`
- `fixtures/valid-mv3-extension.zip`
- `fixtures/remote-script-extension.zip`
- `fixtures/dynamic-code-extension.zip`
- `fixtures/eval-extension.zip`
- `fixtures/packaging-mistake-extension.zip`

## Test workflow

1. Run `npm run build` to verify TypeScript, Vite production build, and static SEO route generation.
2. Run `npm run build:archives` to generate fixture ZIP files.
3. Run `npm run dev` and open the local Vite URL.
4. Drag `fixtures/valid-mv3-extension.zip` into the page. It should have no High findings.
5. Drag `fixtures/remote-script-extension.zip` into the page. It should report CWS001 High.
6. Drag `fixtures/eval-extension.zip` into the page. It should report CWS002 High for dynamic string-code execution.
7. Drag `fixtures/packaging-mistake-extension.zip` into the page. It should report CWS003 High for nested manifest packaging.

## Deployment

The project is configured for Vercel with `vercel.json`:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Static route rewrites: each SEO/trust route points to its generated static `index.html`
- SPA fallback: all other routes rewrite to `/index.html`

Every push to `main` triggers a Vercel production deployment through the GitHub integration.

## Deployment verification

After deployment, verify the production HTML source, not only the rendered browser DOM.

Use browser “View Page Source” or curl for each SEO route:

```bash
curl -L https://chrome-extension-rejection-checker.vercel.app/manifest-v3-pre-submission-checklist
curl -L https://chrome-extension-rejection-checker.vercel.app/blue-argon-chrome-extension-error
curl -L https://chrome-extension-rejection-checker.vercel.app/privacy
```

Confirm that each route has its own:

- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- `og:url`, `og:title`, `og:description`
- `twitter:title`, `twitter:description`
- Visible static body content such as `<h1>`, guide sections, checklist, examples, FAQ, and related links
- FAQPage JSON-LD matching the visible FAQ content for that route

The canonical URL for a guide page should point to that exact guide URL, not to the homepage.

## Analytics safety

Analytics events are pushed to `window.dataLayer`. Do not send ZIP contents, manifest content, source snippets, file names, file paths, package names, extension IDs, or detected URLs to analytics.

Recommended safe event data:

- Aggregate scan status
- Finding totals by severity
- Rule ID summaries
- Page path
- CTA source component
- Content and rules version

## SEO basics

The app includes:

- Homepage explanatory SEO content
- Static SEO and trust routes generated at build time
- Shared SEO route content data
- Related guide internal links
- Visible FAQ content
- FAQPage JSON-LD
- SoftwareApplication/WebApplication JSON-LD
- `public/robots.txt`
- `public/sitemap.xml` with all guide URLs and `lastmod`

When moving to a custom domain, update the canonical domain in:

- `index.html`
- `scripts/generate-static-seo-pages.mjs`
- `public/robots.txt`
- `public/sitemap.xml`
- `README.md`
