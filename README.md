# Chrome Extension Rejection Checker

Free local Chrome Web Store preflight scanner for Manifest V3 extension `.zip` files.

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

## Generate requested archives

Direct binary zip upload from this chat was blocked by safety checks, so the repository includes a generator script.

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
- `fixtures/eval-extension.zip`
- `fixtures/packaging-mistake-extension.zip`
- `fixtures/missing-manifest-extension.zip`
