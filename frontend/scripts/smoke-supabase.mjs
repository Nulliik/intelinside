import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'

const env = loadEnv('development', process.cwd(), '')
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) throw new Error('Missing staging Supabase browser credentials.')

const client = createClient(url, key, { auth: { persistSession: false } })
const expectedMinimums = { models: 4, quants: 14, runtimes: 7, hardware: 40 }

for (const [table, minimum] of Object.entries(expectedMinimums)) {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true })
  if (error) throw error
  if ((count ?? 0) < minimum) throw new Error(`${table}: expected at least ${minimum} rows, received ${count ?? 0}`)
}

for (const table of ['profiles', 'rigs', 'results']) {
  const { error } = await client.from(table).select('*', { count: 'exact', head: true })
  if (error) throw error
}

const { error: deniedWrite } = await client.from('rigs').insert({
  owner_id: '00000000-0000-0000-0000-000000000001',
  name: '__anonymous_write_must_fail__',
  os: 'test',
})
if (!deniedWrite) throw new Error('Anonymous rig insert unexpectedly succeeded.')

process.stdout.write('Supabase anonymous API smoke test passed.\n')
