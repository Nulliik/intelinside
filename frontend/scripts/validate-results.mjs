// Validates result files (results/<handle>/<name>.json) with the same parser the submit form uses.
//   node frontend/scripts/validate-results.mjs [--author <github-login>] [--report <markdown-file>] <file>...
// Exits 1 when any file has a problem. --author also checks that each file sits under that handle's folder.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const args = process.argv.slice(2)
const option = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}
const author = option('--author')
const report = option('--report')
const files = args.filter((arg, index) => !arg.startsWith('--') && args[index - 1] !== '--author' && args[index - 1] !== '--report')

const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { parseResultFile } = await server.ssrLoadModule('/src/lib/pr.ts')
  const lines = []
  let failed = 0
  for (const path of files) {
    const problems = []
    const normalized = path.replace(/^\.\//, '').replace(/^.*?(?=results\/)/, '')
    const location = normalized.match(/^results\/([^/]+)\/[^/]+\.json$/)
    if (!location) problems.push('Result files live at results/<your-github-handle>/<name>.json.')
    else if (author && location[1].toLowerCase() !== author.toLowerCase()) problems.push(`The folder is "${location[1]}" but the pull request was opened by @${author}. Put the file under results/${author}/.`)
    let raw
    try {
      raw = JSON.parse(readFileSync(path, 'utf8'))
    } catch (error) {
      problems.push(`Not valid JSON: ${error.message}`)
    }
    if (raw !== undefined) problems.push(...parseResultFile(raw).problems)
    if (problems.length) {
      failed++
      lines.push(`- ❌ \`${normalized}\``, ...problems.map((problem) => `  - ${problem}`))
    } else lines.push(`- ✅ \`${normalized}\` validates.`)
  }
  if (!files.length) lines.push('No result files to validate.')
  console.log(lines.join('\n'))
  if (report) writeFileSync(report, `${lines.join('\n')}\n`)
  process.exitCode = failed ? 1 : 0
} finally {
  await server.close()
}
