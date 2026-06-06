import fs from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'

const root = process.cwd()

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function listFiles(dir) {
  const results = []

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (['node_modules', 'dist', '.git', '.vercel', '.seo-cache', 'coverage'].includes(entry.name)) continue
        await walk(fullPath)
      } else {
        results.push(fullPath)
      }
    }
  }

  if (await exists(dir)) await walk(dir)
  return results
}

async function zipFiles(files, baseDir, outputPath) {
  const existingFiles = []
  for (const file of files) {
    if (await exists(file)) existingFiles.push(file)
  }

  const zip = new JSZip()
  for (const file of existingFiles) {
    const relative = path.relative(baseDir, file).replaceAll(path.sep, '/')
    zip.file(relative, await fs.readFile(file))
  }

  const data = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  })

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, data)
  console.log(`wrote ${path.relative(root, outputPath)}`)
}

async function zipDirectory(dir, outputPath, includeRoot = false) {
  if (!(await exists(dir))) {
    console.warn(`skip missing directory ${path.relative(root, dir)}`)
    return
  }
  const files = await listFiles(dir)
  const baseDir = includeRoot ? path.dirname(dir) : dir
  await zipFiles(files, baseDir, outputPath)
}

async function main() {
  await fs.mkdir(path.join(root, 'fixtures'), { recursive: true })

  const srcBundleFiles = [
    'index.html',
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tailwind.config.ts',
    'postcss.config.js',
    'README.md',
    'QUICKSTART.md',
    'PRD.md',
    'requirements.md',
    'CREATOR_SKILL.md',
    'FIRST_CONVERSATION_BRIEF.md',
    'UNIVERSAL_FIRST_CONVERSATION_TEMPLATE.md',
    '.gitignore',
  ].map((item) => path.join(root, item))

  const srcFiles = await listFiles(path.join(root, 'src'))
  const publicFiles = await listFiles(path.join(root, 'public'))
  const scriptFiles = await listFiles(path.join(root, 'scripts'))
  const docFiles = await listFiles(path.join(root, 'docs'))
  await zipFiles([...srcBundleFiles, ...srcFiles, ...publicFiles, ...scriptFiles, ...docFiles], root, path.join(root, 'src.zip'))

  const fixtureRoot = path.join(root, 'fixtures-src')
  const fixtureFolders = (await exists(fixtureRoot)) ? await fs.readdir(fixtureRoot, { withFileTypes: true }) : []

  for (const entry of fixtureFolders) {
    if (!entry.isDirectory()) continue
    await zipDirectory(
      path.join(fixtureRoot, entry.name),
      path.join(root, 'fixtures', `${entry.name}.zip`),
      false,
    )
  }

  await zipDirectory(path.join(root, 'fixtures-src'), path.join(root, 'fixtures.zip'), true)
  await zipDirectory(path.join(root, 'fixtures-src', 'valid-mv3-extension'), path.join(root, 'extension-test.zip'), false)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
