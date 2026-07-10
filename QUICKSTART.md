# Quickstart

This project is a local-only web scanner for Chrome extension ZIP files. It helps extension developers run a static preflight check before uploading to the Chrome Web Store.

## 1. Clone the repository

```bash
git clone https://github.com/whywbhydyq/chrome-extension-rejection-checker.git
cd chrome-extension-rejection-checker
```

## 2. Install dependencies

```bash
npm install
```

## 3. Start the local dev server

```bash
npm run dev
```

Open the local Vite URL shown in your terminal, usually:

```txt
http://localhost:5173
```

## 4. Scan an extension ZIP

1. Build or prepare a Chrome extension `.zip` file.
2. Open the web app.
3. Drop the `.zip` into the upload area.
4. Review High, Medium, and Low findings.
5. Copy the Markdown report or download the JSON report.

## 5. Build for production

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 6. Generate local fixture ZIPs

The repository includes a generator script for test archives.

```bash
npm run build:archives
```

This will generate:

```txt
src.zip
fixtures.zip
extension-test.zip
fixtures/valid-mv3-extension.zip
fixtures/remote-script-extension.zip
fixtures/eval-extension.zip
fixtures/packaging-mistake-extension.zip
fixtures/missing-manifest-extension.zip
```

## Trust model

The scanner is designed to run in the browser only.

- No backend
- No login
- No source-code upload
- No Chrome Web Store API calls
- No guarantee of approval

The product promise is:

> Runs locally. Your extension never leaves your browser.

## What High means

High findings are intentionally conservative. They should only be used for issues that are likely to cause rejection or upload/review failure, such as:

- Missing or invalid manifest
- Manifest not at ZIP root
- Manifest V2
- Missing manifest-referenced files
- Remote hosted executable code
- Dynamic string-code execution
- Unsafe extension CSP

## What Medium means

Medium findings are review risks, not automatic rejection claims. Examples:

- Broad host permissions
- Sensitive Chrome API permissions
- Privacy disclosure review reminders
- Missing icon declarations or missing icon files

## What Low means

Low findings are manual review notes. For example, a remote API URL may be totally valid, but the developer should confirm it is not being used to load executable code.
