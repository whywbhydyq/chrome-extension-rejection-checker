const owner = process.env.VERCEL_GIT_REPO_OWNER || 'whywbhydyq'
const repo = process.env.VERCEL_GIT_REPO_SLUG || 'chrome-extension-rejection-checker'
const branch = process.env.VERCEL_GIT_COMMIT_REF || 'main'
const currentSha = process.env.VERCEL_GIT_COMMIT_SHA

if (!currentSha) {
  console.log('No VERCEL_GIT_COMMIT_SHA found. Continue build.')
  process.exit(1)
}

const url = `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`

try {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'vercel-skip-old-builds',
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    console.log(`Could not check latest commit. Continue build. Status: ${response.status}`)
    process.exit(1)
  }

  const latest = await response.json()
  const latestSha = latest.sha

  if (latestSha && latestSha !== currentSha) {
    console.log(`Skip old Vercel build. Current: ${currentSha}. Latest ${branch}: ${latestSha}`)
    process.exit(0)
  }

  console.log(`Current commit is latest on ${branch}. Continue build.`)
  process.exit(1)
} catch {
  console.log('Commit check failed. Continue build.')
  process.exit(1)
}
