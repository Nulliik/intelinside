import { test, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

let supabaseApi, supabase, resultFileFor, parseResultFile
before(async () => {
  mock.method(globalThis, 'fetch', () => assert.fail('Unexpected HTTP request'))
  const bundle = await build({
    stdin: {
      contents: `export { supabaseApi } from './lib/api/supabase';
        export { supabase } from './lib/auth';
        export { resultFileFor, parseResultFile } from './lib/pr';`,
      resolveDir: fileURLToPath(new URL('../../src', import.meta.url)),
    },
    alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) },
    define: { 'import.meta.env': JSON.stringify({
      VITE_SUPABASE_URL: 'https://evidence-test.supabase.invalid',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_evidence_test',
    }) },
    bundle: true, write: false, platform: 'browser', format: 'esm', logLevel: 'silent',
  })
  ;({ supabaseApi, supabase, resultFileFor, parseResultFile } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
  ))
  await supabase.auth.getSession()
  await supabase.auth.stopAutoRefresh()
})
after(() => mock.restoreAll())

const input = { rigId: '1', modelId: 'qwen3-8b', quant: 'q4_k_m', runtimeId: 'llamacpp',
  runtimeVersion: 'b6512', decodeTps: 34.2, runDate: '2026-09-04' }

test('result JSON export retains optional evidence through parsing and omits absent evidence', () => {
  for (const repoUrl of [undefined, '', 'https://example.com/logs/run.json']) {
    const exported = JSON.parse(JSON.stringify(resultFileFor({ ...input, repoUrl }, 'https://intelinside.ai/results/42')))
    assert.equal('evidenceUrl' in exported, !!repoUrl)
    const { file, problems } = parseResultFile(exported)
    assert.deepEqual(problems, [])
    assert.equal(file.evidenceUrl, repoUrl || undefined)
    assert.equal(file.result, 'https://intelinside.ai/results/42')
  }
})

test('Supabase adapter creates, edits, and clears evidence without writing PR provenance', async (t) => {
  t.mock.method(supabase.auth, 'getSession', async () => ({ data: { session: { user: { id: 'owner' } } }, error: null }))
  t.mock.method(supabase.auth, 'getUser', async () => ({ data: { user: { id: 'owner' } }, error: null }))
  let row
  const writes = []
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const parsed = new URL(url)
    assert.equal(parsed.origin, 'https://evidence-test.supabase.invalid')
    if (parsed.pathname !== '/rest/v1/results') return Response.json([])
    if (init.method === 'POST') {
      const payload = JSON.parse(init.body)
      writes.push(payload)
      row = { ...payload, id: 42, source_pr_url: null, verification_status: 'self_reported',
        confirmations_count: 0, flags_count: 0, hidden: false, created_at: '2026-09-04', updated_at: '2026-09-04' }
    } else if (init.method === 'PATCH') {
      const payload = JSON.parse(init.body)
      writes.push(payload)
      Object.assign(row, payload)
    }
    return Response.json(row ? [row] : [])
  })
  const created = await supabaseApi.createResult(input)
  assert.equal(writes.at(-1).repo_url, null)
  assert.equal(created.repoUrl, undefined)
  assert.equal(created.sourcePrUrl, undefined)

  // Emulate a row imported by CI; browser edits must leave its source intact.
  row.source_pr_url = 'https://github.com/labscommunity/intelinside/pull/42'
  const edited = await supabaseApi.updateResult('42', { repoUrl: '  https://example.com/report  ' })
  assert.equal(edited.repoUrl, 'https://example.com/report')
  assert.equal(edited.sourcePrUrl, row.source_pr_url)
  for (const repoUrl of ['', undefined]) {
    const cleared = await supabaseApi.updateResult('42', { repoUrl })
    assert.equal(writes.at(-1).repo_url, null)
    assert.equal(cleared.repoUrl, undefined)
    assert.equal(cleared.sourcePrUrl, row.source_pr_url)
  }
  await supabaseApi.updateResult('42', { notes: 'Updated notes' })
  assert.equal('repo_url' in writes.at(-1), false)
  assert.ok(writes.every((payload) => !('source_pr_url' in payload)))
})
