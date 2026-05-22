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

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
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

1. Run `npm run build` to verify TypeScript and Vite production build.
2. Run `npm run build:archives` to generate fixture ZIP files.
3. Run `npm run dev` and open the local Vite URL.
4. Drag `fixtures/valid-mv3-extension.zip` into the page. It should have no High findings.
5. Drag `fixtures/remote-script-extension.zip` into the page. It should report CWS001 High.
6. Drag `fixtures/packaging-mistake-extension.zip` into the page. It should report CWS003 High for nested manifest packaging.

## Deployment

The project is configured for Vercel with `vercel.json`:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Every push to `main` triggers a Vercel production deployment through the GitHub integration.

## SEO basics

The app includes:

- Homepage explanatory SEO content
- `public/robots.txt`
- `public/sitemap.xml`

When moving to a custom domain, update both files to the final canonical domain.
