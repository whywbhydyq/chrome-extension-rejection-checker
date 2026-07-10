# First Conversation Brief for Building a New Web Tool

Use this when starting a new web tool project with ChatGPT. The more of this you provide in the first message, the faster the project can move from idea to working MVP.

## Copy-paste starter prompt

```text
I want to build a small web tool using the same workflow as Chrome Extension Rejection Checker.

Project idea:
- Product name:
- One-line positioning:
- Target users:
- User input:
- Tool output:
- Must run locally or can use backend:
- Must not upload/store user files:
- Main pain/problem:
- Current alternatives/competitors:
- Primary SEO keyword:
- 3-5 long-tail SEO keywords:
- MVP rules/features:
- What is High/Medium/Low risk or result severity:
- Report/export requirements:
- Tech preference:
- GitHub repo URL:
- Deployment target:
- Domain/canonical URL:
- Constraints:
- What I want you to do first:

Please first turn this into PRD.md + requirements.md, then build the MVP in small GitHub commits, and make sure npm run build passes before calling it complete.
```

## What I most want to know first

### 1. The exact tool input

Tell me what the user provides.

Examples:

- Upload `.zip`
- Upload `.csv`
- Upload `.pdf`
- Paste JSON
- Paste logs
- Paste URL
- Upload image
- Drag folder/package

This matters because input type decides the parser, libraries, browser limits, privacy promise, fixtures, and test cases.

### 2. The exact tool output

Tell me what users should get back.

Examples:

- High/Medium/Low risk report
- Valid/invalid result
- Table of detected problems
- Markdown report
- JSON report
- Downloadable fixed file
- Checklist
- Score
- Preview

If output is vague, the product becomes vague.

### 3. The trust boundary

Tell me whether the tool must be local-only.

Possible choices:

- Fully local in browser, no upload
- Upload allowed, but no storage
- Backend allowed for heavy processing
- Login required
- No login for MVP

For developer/file tools, local-only is often the best first trust promise.

### 4. The core user pain

Tell me the painful moment that triggers the search.

Good phrasing:

- User got a vague rejection email.
- User has a file but does not know why it fails.
- User generated code with AI and wants to verify it before submitting.
- User wants a preflight check before uploading.
- User needs a quick smoke test before release.

Bad phrasing:

- Make a useful tool.
- Help developers.
- Build a validator.

### 5. The target user

Tell me who uses it and their skill level.

Examples:

- Beginner Chrome extension developer
- AI/vibe coding user
- Indie hacker
- Small team developer
- SEO operator
- Accountant
- Designer
- Data analyst

This affects wording, warnings, UI, and how much explanation to include.

### 6. What counts as a serious finding

For checker tools, define severity early.

Example:

- High: likely to fail submission or block user
- Medium: review/manual confirmation needed
- Low: cleanup or informational note

This prevents noisy tools that scare users.

### 7. What the tool must not claim

Tell me forbidden claims.

Examples:

- Do not guarantee approval.
- Do not claim legal compliance.
- Do not call something malware.
- Do not say all warnings are violations.
- Do not upload source code.
- Do not auto-fix files.

This is crucial for trust.

### 8. Existing competitors or references

Tell me alternatives, even if they are imperfect.

Examples:

- Official docs
- Existing web tools
- GitHub repos
- Browser extensions
- CLI tools
- SaaS competitors

This helps choose positioning and avoid building a worse clone.

### 9. SEO keywords and user search intent

Tell me likely search queries.

Best keywords are specific pain queries:

- `fix remotely hosted code manifest v3`
- `chrome web store rejection checker`
- `csv delimiter detector`
- `json schema error explainer`
- `pdf page size checker`

Avoid generic keywords first:

- `developer tool`
- `file checker`
- `AI validator`

### 10. Repository and deployment details

Tell me:

- GitHub repo URL
- Branch name, usually `main`
- Whether repo is empty or has existing code
- Vercel/Cloudflare preference
- Production domain if known

This prevents deployment and file-update friction.

## What I should know before touching code

### Product boundary

I need to know what to build and what not to build.

Use this format:

```text
Do:
- Local scan
- Generate report
- Copy Markdown
- Download JSON

Do not:
- Upload files
- Require login
- Call third-party APIs
- Promise guaranteed success
- Auto-fix user files in MVP
```

### Rule list

If it is a checker, give me initial rule IDs.

Example:

```text
TOOL001 High Missing required file
TOOL002 High Invalid config syntax
TOOL003 Medium Broad setting needs review
TOOL004 Low Remote URL found for manual review
```

Rule IDs make reports, tests, docs, and SEO easier.

### Data model

If you have a preferred report shape, give it early.

Default recommended shape:

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

### MVP acceptance criteria

Tell me what must be true before we call MVP done.

Example:

```text
A user can:
1. Open the page
2. Drop a file
3. See useful findings
4. Copy Markdown report
5. Download JSON report
6. Understand the tool is local-only
7. Run npm run build successfully
```

### Test fixtures

Tell me which sample files are needed.

Example:

```text
fixtures/
  valid-example.zip
  missing-config.zip
  remote-code-risk.zip
  invalid-json.zip
```

Fixtures should include both normal and broken examples.

## Best first message for this exact workflow

Use this full prompt when starting a new tool:

```text
I want to build a new local-first web tool.

Goal:
[one sentence]

Target user:
[who uses it]

Pain:
[what happened right before they search]

Input:
[file/text/data the user provides]

Output:
[report/fixed file/checklist/score]

Trust boundary:
[local-only/no upload/backend allowed/no login]

MVP features:
1.
2.
3.
4.
5.

Rules/checks:
- TOOL001 High ...
- TOOL002 High ...
- TOOL003 Medium ...
- TOOL004 Low ...

Report fields:
- severity
- title
- file/line/snippet if possible
- reason
- recommendation
- source link if possible

SEO keywords:
- main keyword:
- long-tail keyword 1:
- long-tail keyword 2:
- long-tail keyword 3:
- long-tail keyword 4:

Tech/deploy:
- Vite + React + TypeScript
- Tailwind
- Vitest
- GitHub repo:
- Vercel or Cloudflare:
- domain:

Constraints:
- Do not overbuild backend/CLI before web MVP
- High findings must be conservative
- Add tests after rules stabilize
- Run npm run build before calling it complete

Please create PRD.md and requirements.md first, then implement the MVP in small GitHub commits using the same workflow as Chrome Extension Rejection Checker.
```

## What to ask ChatGPT to do in order

Best command sequence:

```text
1. Turn this into PRD.md and requirements.md.
2. Create package.json and project skeleton.
3. Build parser/input reader and normalized context.
4. Build rule engine and first 5-10 rules.
5. Build upload UI and report UI.
6. Add Markdown and JSON export.
7. Add fixtures and npm scripts.
8. Add README and QUICKSTART.
9. Deploy with Vercel config.
10. Add SEO content and sitemap/robots.
11. Add tests.
12. Refactor components.
13. Run final acceptance checklist.
```

## What not to do in the first conversation

Avoid starting with:

- Build everything, no spec.
- Make it beautiful first.
- Add login.
- Add payment.
- Add AI auto-fix.
- Add CLI before the web tool.
- Add analytics before the first useful scan.
- Write 20 SEO pages before the tool works.

## Minimum information if you are in a hurry

If you only send five things, send these:

```text
1. Tool input:
2. Tool output:
3. Main user pain:
4. Trust boundary:
5. GitHub repo URL:
```

With just those, I can usually create a good first PRD and implementation plan.

## Strong opinions from this project

- The first screen should be the tool, not a marketing page.
- Local-only is a powerful trust promise for file/source-code tools.
- High severity must be conservative.
- Manual checklist is better than fake certainty.
- Fixtures reveal product problems faster than discussion.
- Build passing locally matters more than saying it is done.
- GitHub commits should be small enough to inspect.
- SEO pages should target actual pain phrases, not broad categories.
- Components should be extracted after behavior works, not before.
- Every tool should have copy/export actions.

## Final first-conversation checklist

Before asking me to code, try to provide:

```text
Product name:
One-line positioning:
Target user:
Trigger pain:
Input type:
Output type:
Local-only or backend:
Data privacy promise:
MVP features:
Rule list:
Severity definitions:
Manual checklist items:
Report/export needs:
SEO keywords:
Competitors/references:
Tech stack preference:
GitHub repo URL:
Deployment target:
Domain/canonical URL:
Stop conditions:
What to do first:
```

If you provide this, the project can usually move directly from first chat to PRD, code skeleton, MVP rules, deploy, and validation.
