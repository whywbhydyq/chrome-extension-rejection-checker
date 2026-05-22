# Universal First Conversation Template for New Web Tools

Use this as the first message when starting a new web tool project. The fields that are usually universal for your local-first indie tool workflow have been pre-filled. Unknown project-specific fields are intentionally left blank.

## Copy-paste prompt

```text
I want to build a small local-first web tool using the same workflow as Chrome Extension Rejection Checker.

Please do not start by building a generic SaaS landing page. The first screen should be a usable tool.

Project idea:
- Product name:
- One-line positioning:
- Target users: indie hackers, AI/vibe coding users, solo developers, small teams, and users who have a concrete file/text/data problem they want to check quickly
- User input:
- Tool output: High/Medium/Low report when applicable, useful findings, manual checklist, copyable Markdown report, downloadable JSON report
- Must run locally or can use backend: prefer fully local in browser for MVP; use backend only if the task cannot reasonably run in the browser
- Must not upload/store user files: yes by default; do not upload, store, or log user files/source/data in MVP unless I explicitly say backend is allowed
- Main pain/problem:
- Current alternatives/competitors:
- Primary SEO keyword:
- 3-5 long-tail SEO keywords:
- MVP rules/features:
- What is High/Medium/Low risk or result severity:
  - High: likely to block submission, break the workflow, or represent a strong failure signal
  - Medium: needs review, explanation, or manual confirmation; do not claim automatic failure
  - Low: informational note, cleanup suggestion, or manual review item
- Report/export requirements: show severity, title, file/line/snippet when possible, reason, recommendation, and source/reference link when available; support Copy Markdown and Download JSON
- Tech preference: Vite + React + TypeScript, Tailwind CSS, Vitest for tests, pure frontend parser libraries when possible
- GitHub repo URL:
- Deployment target: Vercel preferred; Cloudflare Pages acceptable for static-only tools
- Domain/canonical URL:
- Constraints:
  - Web MVP first, not CLI first
  - No login for MVP unless required
  - No payment for MVP
  - No backend unless browser-local implementation is impossible
  - No AI auto-fix in MVP unless explicitly requested
  - High findings must be conservative and trustworthy
  - Manual checklist is better than fake certainty
  - Do not claim guaranteed approval/compliance/success
  - Do not overbuild before real usage validation
- What I want you to do first: create PRD.md and requirements.md, then implement the MVP in small GitHub commits; run or design for npm run build/test checks before calling it complete

Please first turn this into PRD.md + requirements.md, then build the MVP in small GitHub commits using the same workflow as Chrome Extension Rejection Checker.
```

## Filled brief

### Product name



### One-line positioning

`Users provide [input], the tool checks [specific problem] locally, and returns [report/output] without unnecessary signup or upload.`

### Target user

Default audience:

- Indie hackers
- AI/vibe coding users
- Solo developers
- Small teams
- Technical beginners with a concrete file/data/code problem
- Users searching for a specific error, rejection, validation, formatting, or preflight check

Project-specific target user:



### Trigger pain

Default trigger patterns:

- User has a file/text/data package but does not know why it fails.
- User got a vague error/rejection message.
- User generated something with AI and wants to verify it before submitting or publishing.
- User wants a quick preflight check before upload/release/submission.
- User wants exact file/line/snippet location instead of reading scattered docs.

Project-specific trigger pain:



### Input type

Unknown. Choose one or more:

- Upload file
- Upload ZIP/package
- Upload CSV
- Upload PDF
- Upload image
- Paste JSON
- Paste logs
- Paste URL
- Paste code/config
- Drag folder/package if browser support allows

Final input type:



### Output type

Default output:

- High/Medium/Low findings when severity applies
- File/path/line/snippet when possible
- Reason
- Recommendation
- Source/reference link when possible
- Manual checklist for things the tool cannot know
- Copy Markdown report
- Download JSON report

Project-specific output:



### Local-only or backend

Default:

- Prefer local-only browser processing.
- No upload for MVP.
- No login for MVP.
- Backend only if the browser cannot reasonably process the input.

Project-specific decision:



### Data privacy promise

Default first-screen promise:

`Runs locally. Your file never leaves your browser.`

Alternative for source-code tools:

`Runs locally. Your source code never leaves your browser.`

Alternative for text tools:

`Runs locally. Your pasted text is processed in your browser.`

Project-specific privacy copy:



### MVP features

Default MVP features:

1. First-screen usable input area.
2. Browser-local parser or validator.
3. 5-10 conservative, high-confidence checks.
4. Results grouped by severity or category.
5. File/path/line/snippet display when possible.
6. Clear reason and recommendation for every finding.
7. Copy Markdown report.
8. Download JSON report.
9. Manual checklist for anything the tool cannot know.
10. SEO explanation section below the tool.

Project-specific MVP features:

1.
2.
3.
4.
5.

### Rule list

Use this structure:

```text
TOOL001 High Missing required file/config/input
TOOL002 High Invalid syntax or parse failure
TOOL003 High Strong failure/rejection/blocking risk
TOOL004 Medium Broad/risky setting that needs review
TOOL005 Medium Missing recommended metadata or explanation
TOOL006 Low Remote URL / informational note / cleanup suggestion
```

Project-specific rules:

```text
TOOL001 High
TOOL002 High
TOOL003 Medium
TOOL004 Low
```

### Severity definitions

Default:

- High: likely to block submission, break the workflow, or represent a strong failure signal. Be conservative.
- Medium: needs review, explanation, narrowing, or manual confirmation. Do not claim automatic failure.
- Low: useful informational note, cleanup suggestion, or manual review item.

Project-specific severity definition:



### Manual checklist items

Default manual checklist:

- Fields that exist outside the uploaded input.
- Account/dashboard settings.
- Human policy interpretation.
- Third-party approval state.
- User intent and claims.
- Legal/compliance items that cannot be proven locally.
- Final submission/release checklist.

Project-specific manual checklist:



### Report/export needs

Default report fields:

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

Default exports:

- Copy Markdown
- Download JSON

Project-specific report fields:



### SEO keywords

Default keyword strategy:

- Prefer specific pain queries over broad category terms.
- Main keyword should describe the concrete tool.
- Long-tail pages should target specific errors, fixes, validation checks, or pre-submission workflows.

Main keyword:



Long-tail keywords:

1.
2.
3.
4.
5.

### Competitors/references

Unknown. Provide:

- Official docs
- Existing tools
- GitHub repos
- SaaS products
- CLI tools
- Forum threads with repeated pain

Competitors/references:



### Tech stack preference

Default:

```text
Vite + React + TypeScript
Tailwind CSS
Vitest
Pure frontend parser library when possible
GitHub repository
Vercel deployment
robots.txt + sitemap.xml
No backend for MVP unless needed
```

Project-specific stack changes:



### GitHub repo URL



### Deployment target

Default:

`Vercel`

Alternative:

`Cloudflare Pages`

Final deployment target:



### Domain/canonical URL



### Stop conditions

Default stop conditions:

- No real users use the input tool.
- Users land on the page but do not upload/paste anything.
- Search Console shows no impressions after enough time.
- False positives destroy user trust.
- Existing alternatives already solve the pain well enough.
- The tool requires too much backend or manual review for a fast MVP.

Project-specific stop conditions:



### What to do first

Default:

1. Create `PRD.md`.
2. Create `requirements.md`.
3. Create project skeleton.
4. Build parser/input reader.
5. Build normalized context and rule engine.
6. Build first 5-10 rules.
7. Build UI and report export.
8. Add fixtures and tests.
9. Add README/QUICKSTART.
10. Add Vercel config, robots, sitemap.
11. Deploy.
12. Add SEO pages.
13. Run final acceptance checklist.

Project-specific first step:



## Universal acceptance criteria

Before calling MVP complete:

```text
A user can:
1. Open the page.
2. Provide the intended input.
3. Get useful results quickly.
4. Understand whether the tool is local-only or backend-based.
5. See clear reasons and recommendations.
6. Copy a Markdown report when useful.
7. Download JSON when useful.
8. See manual checklist items for things the tool cannot know.
9. Run npm run build successfully.
10. Run npm run test if tests exist.
```

## Universal build commands

```bash
npm install
npm run dev
npm run build
npm run test
npm run build:archives
```

Use only the commands that exist in the project. If a command does not exist yet, add it or remove it from docs.

## Universal GitHub workflow

```bash
git pull
npm install
npm run test
npm run build
git status
git add .
git commit -m "Describe the change"
git push origin main
```

## Universal deployment defaults

`vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

`robots.txt`:

```txt
User-agent: *
Allow: /

Sitemap: https://YOUR_DOMAIN/sitemap.xml
```

`sitemap.xml` should use the stable canonical domain, not a random preview deployment URL.

## Universal warnings to include in most tools

- This is a static/local preflight tool, not an official validator.
- High findings are conservative but not a guarantee of failure.
- Medium findings require review and context.
- Manual checklist items cannot be verified from the input alone.
- Do not upload sensitive files unless the project explicitly allows backend processing.

## Universal final instruction to ChatGPT

```text
Do not call the project complete just because files were created. Check the original requirements against the implementation. Tell me what is complete, what is partial, and what is missing. Prioritize fixing P0 gaps before polishing UI or SEO.
```
