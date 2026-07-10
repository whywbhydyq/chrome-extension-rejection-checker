# Chrome Extension Rejection Checker remediation

- Moved the local ZIP scanner workbench ahead of explanatory marketing content so the first primary panel is the tool.
- Kept one page-level H1 inside the scanner panel and changed the later explanatory heading to H2.
- Fixed the CSP finding contract so `unsafe-eval` and `unsafe-inline` findings name the exact unsafe token.
- Lazy-loaded the ZIP parser and JSZip only after a user selects a file.
- Added stable Vite chunk boundaries for React, retained JSZip as a user-triggered lazy chunk, and removed the unused icon dependency.
- Added an automated quality audit for tool-first layout, heading hierarchy, scanner privacy fallback, exact CSP titles, and dynamic ZIP loading.
