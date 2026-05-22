# Creator Skill: Local Tool Website MVP Workflow

This note summarizes the reusable method from building Chrome Extension Rejection Checker. Use it as a checklist for future small web tools.

## One-line principle

Build a real first-screen tool for a specific painful workflow, validate with real user actions, then use long-tail SEO pages to capture repeat search demand.

## Best project type

This workflow fits tools where users already have a concrete input and want an immediate answer.

Good examples:

- Upload a ZIP and check rejection risks
- Paste JSON and find schema errors
- Upload CSV and detect delimiter/encoding problems
- Upload PDF and inspect metadata or page issues
- Paste logs and classify known error patterns
- Upload images and check dimensions/compression

Bad examples:

- Pure blog site without a tool
- Generic SaaS homepage before a working function
- AI wrapper without a clear pain or input/output loop
- Tool requiring accounts, backend, or permissions before MVP demand is proven

## Reusable build sequence

### 1. Start with a narrow pain

Write the product in one sentence:

`User uploads/pastes X, tool checks Y locally, output is Z report.`

For this project:

`Chrome extension developer uploads a ZIP, tool checks common Chrome Web Store rejection risks locally, output is a High/Medium/Low report.`

### 2. Define hard boundaries early

Boundaries prevent scope creep and user mistrust.

For local developer tools, state:

- No upload
- No account
- No backend unless necessary
- No guarantee claims
- Static preflight scan, not official validator
- High findings must be conservative

### 3. Design the data model before UI

The most important object in this project was `Finding`:

```ts
type Finding = {
  ruleId: string
  severity: 'high' | 'medium' | 'low'
  title: string
  file?: string
  line?: number
  snippet?: string
  reason: string
  recommendation: string
  sourceUrl?: string
}
```

Every future checker should create a similar normalized finding/report structure first.

### 4. Build a normalized context layer

Rules should not directly read raw files, ZIPs, DOM, APIs, or upload objects.

Use a context object:

```ts
type ScannerContext = {
  inputName: string
  files: Map<string, VirtualFile>
  textFiles: VirtualFile[]
  metadata: Record<string, unknown>
}
```

This makes it easier to reuse rules later in CLI, GitHub Action, or batch mode.

### 5. Build rule modules as pure functions

Good rule shape:

```ts
export function runSomeRules(context: ScannerContext): Finding[]
```

This makes tests easy and reduces UI coupling.

### 6. Ship the smallest truthful MVP

The first MVP should include:

- Input area
- Local parser
- 5-10 high-confidence rules
- Results grouped by severity
- Copy Markdown
- Download JSON
- Manual checklist for things the tool cannot know
- SEO explanation section below the tool

Avoid adding weak rules just to look comprehensive.

### 7. Add SEO after the tool works

SEO pages should be based on real search intent, not generic marketing.

Recommended page pattern:

- Main tool page
- One page for the most painful error
- One page for the main checklist
- One page for a common rejection/fix
- One page for permissions/privacy/manual review

For each page:

- Use the keyword in title/H1
- Explain the issue in plain language
- Show what the tool checks
- Give manual fix steps
- Link back to the scanner

### 8. Add tests after rules stabilize

Unit-test rules, not the whole UI first.

Minimum tests:

- One true-positive test per rule
- One false-positive guard per noisy rule
- One fixture test for normal input
- One fixture test for broken input

### 9. Deploy early

Use GitHub + Vercel:

- `npm run build` must pass locally
- Add `vercel.json`
- Use stable production domain in `robots.txt` and `sitemap.xml`
- Push to main and let Vercel auto-deploy

## Code creation and commit workflow

When using ChatGPT plus GitHub tools to build a project, work in small, verifiable commits.

Recommended commit order:

1. Add documents first: `PRD.md`, `requirements.md`, `README.md`, `QUICKSTART.md`.
2. Add minimal app shell: `package.json`, `index.html`, `vite.config.ts`, `tsconfig`, Tailwind config.
3. Add core types before rules: `Finding`, `VirtualFile`, `ScannerContext`, `ScanReport`.
4. Add parser/input reader: ZIP reader, file normalizer, line utilities.
5. Add one or two rule files at a time.
6. Add UI after the data flow works.
7. Add export actions: Markdown and JSON.
8. Add fixtures and test scripts.
9. Add SEO files and deployment config.
10. Refactor components only after the behavior is stable.

Why this order works:

- It keeps every commit understandable.
- Build errors are easier to locate.
- Rules can be tested without UI.
- UI does not block core scanner logic.
- SEO and components do not distract from the first useful scan.

## GitHub workflow used in this project

### Initialize repository

If the repository is empty, create a tiny first file before larger work:

```bash
echo "initializing repository" > .gitkeep
git add .gitkeep
git commit -m "Initialize repository"
git push origin main
```

When using GitHub through ChatGPT tools, a repository may need an initial commit before file operations work smoothly.

### Local sync loop

After ChatGPT pushes code, always run locally:

```bash
git pull
npm install
npm run build
```

When tests exist, run:

```bash
npm run test
npm run build
```

When fixture archives exist, run:

```bash
npm run build:archives
```

### Normal local commit loop

For manual changes:

```bash
git status
git add .
git commit -m "Describe the change clearly"
git push origin main
```

### Useful debugging commands

```bash
npm run dev          # local development server
npm run build        # TypeScript + production build
npm run preview      # preview built dist output
npm run test         # Vitest rule tests
npm run typecheck    # TypeScript only
npm run build:archives
```

## Command-line and build pitfalls from this project

### Pitfall: `npm run dev` and `npm run build` are different

`npm run dev` starts a development server and keeps running. It does not finish by itself.

`npm run build` compiles TypeScript and builds production files into `dist/`.

Use this workflow:

```bash
npm run dev
# test in browser
# press Ctrl+C to stop dev server
npm run build
```

Or use two terminals if you want both.

### Pitfall: TypeScript build can fail even when Vite dev runs

The project initially failed because React type declarations were missing.

Fix:

```bash
npm install -D @types/react @types/react-dom
```

Keep these in `devDependencies` for React + TypeScript projects.

### Pitfall: Windows PowerShell multiline behavior

In PowerShell, if you paste multiple commands, prompts may show `>>`. This is usually fine when commands are separated by new lines, but if a command is incomplete, PowerShell may wait for more input.

Safer commands:

```powershell
git pull
npm install
npm run build
```

Or chain them:

```powershell
git pull; npm install; npm run build
```

### Pitfall: generated archives should not include heavy folders

Do not include these in ZIP/source archives:

```txt
node_modules/
dist/
.git/
.vercel/
.env
.env.local
```

The archive script should explicitly skip build folders and secrets.

### Pitfall: `.gitignore` can block needed generated files

If you ignore all zip files with `*.zip`, but want fixture zips committed, add exceptions:

```gitignore
*.zip
!src.zip
!fixtures.zip
!extension-test.zip
!fixtures/*.zip
```

For most projects, do not commit generated ZIPs unless they are small fixtures or release assets.

### Pitfall: binary fixtures and risky code may be blocked

Trying to commit test files with `eval()` or string-code execution examples may trigger safety filters. Safer alternatives:

- Put risky examples in unit test strings only when allowed.
- Use placeholder fixture files in the repository.
- Add a local fixture generator script for tests that should not be committed directly.
- Document how to create the risky fixture locally.

### Pitfall: React component extraction can leave duplicate code

In this project, some components were extracted while old inline code remained in `App.tsx` temporarily. For future projects, when extracting a component, immediately update `App.tsx` in the same commit or the next commit.

Good pattern:

1. Create `components/UploadZone.tsx`.
2. Import it in `App.tsx`.
3. Delete old inline upload JSX.
4. Run `npm run build`.
5. Commit.

### Pitfall: Vercel deployment config should be explicit

Add `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

This avoids framework detection surprises.

### Pitfall: robots and sitemap should use stable canonical domain

Do not put a random preview URL in `robots.txt` or `sitemap.xml`.

Use the stable production domain:

```txt
https://your-project.vercel.app/
```

Later, replace it with the custom domain.

### Pitfall: Vercel auto-deploy can cancel intermediate commits

When many commits are pushed quickly, Vercel may cancel older deployments and only deploy the newest commit. This is normal. Check the newest production deployment state, not every historical deployment.

## Code patterns worth reusing

### Report-first model

Design reports before UI:

```ts
type ScanReport = {
  inputName: string
  scannedAt: string
  summary: {
    total: number
    high: number
    medium: number
    low: number
  }
  findings: Finding[]
  manualChecklist: ManualChecklistItem[]
}
```

### Rule runner registry

Keep rules independent:

```ts
type RuleRunner = (context: ScannerContext) => Finding[]

const ruleRunners: RuleRunner[] = [
  runManifestRules,
  runRemoteCodeRules,
  runCspRules,
]

export function scanContext(context: ScannerContext): ScanReport {
  const findings = ruleRunners.flatMap((runner) => runner(context))
  return buildReport(findings)
}
```

### File parser boundary

Raw input parsing should happen once:

```ts
const context = await readInput(file)
const report = scanContext(context)
```

Do not parse files inside UI components.

### Export actions

Every useful tool should provide outputs users can carry away:

```txt
Copy Markdown
Download JSON
```

This also gives a measurable success event later.

### Manual checklist pattern

If the tool cannot know something, do not fake certainty. Put it in a manual checklist.

Examples:

- Dashboard fields
- Human policy interpretation
- User intent
- External account settings
- Third-party approval status

### SEO data object pattern

For static SEO pages, keep content in data:

```ts
type SeoPageData = {
  path: string
  title: string
  eyebrow: string
  description: string
  sections: Array<{ heading: string; body: string }>
}
```

Then render it with one reusable `SeoPage` component.

## Lessons learned

### High findings must be rare and trustworthy

A noisy High finding destroys trust. Prefer Medium/Low or manual checklist when unsure.

In this project, `https://chatgpt.com/*` in host permissions was initially reported as a remote URL review item. That was too noisy. The fix was to avoid scanning `manifest.json` host permissions as generic remote URLs.

### Separate violation from review risk

Do not write `will be rejected` unless the rule is truly strong.

Use wording like:

- `likely rejection risk`
- `may increase review scrutiny`
- `manual review needed`
- `privacy disclosure review needed`

### Do not scan things the tool cannot know

Developer Dashboard fields, listing text, privacy form answers, and reviewer interpretation cannot be reliably scanned from a ZIP. Keep these as manual checklist items.

### Build for trust before feature count

Trust signals that mattered:

- `Runs locally. Your extension never leaves your browser.`
- Clear product boundary
- Official reference links
- File path, line number, snippet
- Copyable report
- Conservative High findings

### Use fixtures early

Real upload testing immediately exposed issues:

- ZIP packaged with a parent folder
- Host permissions being treated like generic remote URLs
- README links creating noisy Low findings

Fixtures are not just tests; they are product design feedback.

### Be careful with security filters and test fixtures

Trying to commit files containing `eval()` or string-execution examples may be blocked. Safer approach:

- Keep rule unit tests simple
- Use placeholders in committed fixtures if needed
- Document how to generate risky fixtures locally

### Component extraction should happen after behavior stabilizes

Building everything inside `App.tsx` was fast for MVP, but it became hard to maintain. After the scan flow worked, split into:

- `HeroSection`
- `UploadZone`
- `ScanSummary`
- `ReportActions`
- `FindingList`
- `ManualChecklist`
- `EmptyState`
- `SeverityGuide`
- `SeoContent`

For future projects, start with `App.tsx` if moving fast, but split as soon as the workflow is stable.

## Common pitfalls

### Pitfall 1: Overbuilding before validation

Do not build CLI, login, backend, dashboard, AI repair, or multi-platform support before users actually use the web tool.

### Pitfall 2: Treating warnings as violations

Many checks are contextual. Broad permissions, privacy policy reminders, and remote API URLs are not automatically violations.

### Pitfall 3: SEO pages before the tool is useful

SEO traffic will bounce if the first screen is just a blog page. The tool must be visible and usable immediately.

### Pitfall 4: Testing only happy paths

Broken inputs are where users discover value. Always test:

- Missing main file
- Invalid syntax
- Wrong packaging
- Missing referenced files
- Noisy false-positive case

### Pitfall 5: Forgetting deployment basics

Always include:

- `npm run build`
- `vercel.json`
- `robots.txt`
- `sitemap.xml`
- Stable canonical domain
- README with local test workflow

### Pitfall 6: Claiming completion before running local commands

Do not call a project complete until these pass locally:

```bash
npm install
npm run test
npm run build
npm run build:archives
```

If a command fails, fix the command or update the documentation.

## Future tool template

Use this checklist for the next tool:

```txt
1. Define one painful workflow
2. Define local/no-upload trust promise
3. Define Finding type
4. Build parser/input reader
5. Build normalized context
6. Build 5-10 conservative rules
7. Build result UI
8. Add Markdown/JSON export
9. Add manual checklist
10. Add 3-5 SEO pages
11. Add fixtures
12. Add rule tests
13. Deploy on Vercel
14. Watch real usage and false positives
```

## Good default stack

```txt
Vite + React + TypeScript
Tailwind CSS
Pure frontend parser library when possible
Vitest for rule tests
GitHub + Vercel deployment
robots.txt + sitemap.xml
No backend for MVP
```

## Standard commands for future projects

```bash
npm create vite@latest my-tool -- --template react-ts
cd my-tool
npm install
npm install -D tailwindcss postcss autoprefixer vitest
npm install jszip
npm run dev
npm run build
npm run test
```

For GitHub:

```bash
git init
git add .
git commit -m "Initial MVP"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

For Vercel:

```bash
npm install -g vercel
vercel login
vercel deploy
vercel --prod
```

Or connect GitHub in Vercel and let pushes to `main` auto-deploy.

## Decision rule for future ideas

Build it if:

- The user has a file/text/input ready
- The result can be shown immediately
- The rules are mostly static and explainable
- Long-tail search intent exists
- The first version can be built in 3-7 days

Pause or reject it if:

- It needs a login before value
- It needs expensive backend processing
- The result cannot be trusted without human review
- The problem is too generic
- There are no obvious search queries
