import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity'

type JsonObject = Record<string, unknown>
type FieldErrors = Record<string, string>

class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: FieldErrors,
  ) {
    super(message)
  }
}

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
})

const json = (body: unknown, status = 200) => Response.json(body, { status })

function object(value: unknown, name: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestError(400, 'validation', `${name} must be an object.`)
  }
  return value as JsonObject
}

function requiredString(input: JsonObject, field: string): string {
  const value = input[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw new RequestError(400, 'validation', 'Fix the highlighted fields.', { [field]: 'This field is required.' })
  }
  return value.trim()
}

function optionalString(input: JsonObject, field: string): string | null {
  const value = input[field]
  if (value == null || value === '') return null
  if (typeof value !== 'string') {
    throw new RequestError(400, 'validation', 'Fix the highlighted fields.', { [field]: 'Enter valid text.' })
  }
  return value.trim() || null
}

function requiredNumber(input: JsonObject, field: string): number {
  const value = input[field]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RequestError(400, 'validation', 'Fix the highlighted fields.', { [field]: 'Enter a valid number.' })
  }
  return value
}

function optionalNumber(input: JsonObject, field: string): number | null {
  const value = input[field]
  if (value == null) return null
  return requiredNumber(input, field)
}

function moderate(entries: Array<[field: string, value: string | null, maxLength: number]>) {
  const fields: FieldErrors = {}
  for (const [field, value, maxLength] of entries) {
    if (!value) continue
    if (value.length > maxLength) fields[field] = `Use ${maxLength} characters or fewer.`
    else if (matcher.hasMatch(value)) fields[field] = 'Please remove offensive or profane language.'
  }
  if (Object.keys(fields).length) throw new RequestError(400, 'moderation_rejected', 'Please revise the highlighted text.', fields)
}

function components(input: JsonObject): Array<{ hardware_id: string; quantity: number }> {
  if (!Array.isArray(input.components) || input.components.length === 0) {
    throw new RequestError(400, 'validation', 'Fix the highlighted fields.', { components: 'Add at least one component.' })
  }
  return input.components.map((value) => {
    const component = object(value, 'component')
    const hardwareId = requiredString(component, 'hardwareId')
    const quantity = requiredNumber(component, 'quantity')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 64) {
      throw new RequestError(400, 'validation', 'Fix the highlighted fields.', { components: 'Component quantities must be between 1 and 64.' })
    }
    return { hardware_id: hardwareId, quantity }
  })
}

function resultValues(input: JsonObject, partial: boolean): JsonObject {
  const requiredFields: Array<[string, string, 'string' | 'number']> = [
    ['modelId', 'model_id', 'string'],
    ['quant', 'quant_id', 'string'],
    ['runtimeId', 'runtime_id', 'string'],
    ['runtimeVersion', 'runtime_version', 'string'],
    ['rigId', 'rig_id', 'string'],
    ['decodeTps', 'decode_tps', 'number'],
    ['repoUrl', 'repo_url', 'string'],
    ['runDate', 'run_date', 'string'],
  ]
  const optionalFields: Array<[string, string, 'string' | 'number']> = [
    ['componentId', 'component_id', 'string'],
    ['componentQuantity', 'component_quantity', 'number'],
    ['promptTps', 'prompt_tps', 'number'],
    ['ttftMs', 'ttft_ms', 'number'],
    ['contextLength', 'context_length', 'number'],
    ['batchSize', 'batch_size', 'number'],
    ['notes', 'notes', 'string'],
  ]
  const values: JsonObject = {}

  for (const [source, target, type] of requiredFields) {
    if (partial && !(source in input)) continue
    values[target] = type === 'string' ? requiredString(input, source) : requiredNumber(input, source)
  }
  for (const [source, target, type] of optionalFields) {
    if (partial && !(source in input)) continue
    values[target] = type === 'string' ? optionalString(input, source) : optionalNumber(input, source)
  }
  if (values.component_id == null && (!partial || 'componentId' in input)) values.component_quantity = null
  return values
}

function databaseError(error: { code?: string; message: string }): RequestError {
  const status = error.code === 'P0002' ? 404 : error.code?.startsWith('23') || error.code === '22023' ? 400 : 500
  return new RequestError(status, error.code ?? 'database_error', status === 500 ? 'Could not save your changes.' : error.message)
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    try {
      if (req.method !== 'POST') throw new RequestError(405, 'method_not_allowed', 'Use POST for this endpoint.')
      const body = object(await req.json(), 'request')
      const action = requiredString(body, 'action')
      const input = object(body.input, 'input')
      const userId = ctx.userClaims?.sub
      if (!userId) throw new RequestError(401, 'unauthorized', 'Sign in to do that.')
      const moderatedAt = new Date().toISOString()

      if (action === 'createRig' || action === 'updateRig') {
        const name = requiredString(input, 'name')
        const os = optionalString(input, 'os') ?? ''
        const notes = optionalString(input, 'notes')
        moderate([['name', name, 120], ['os', os, 120], ['notes', notes, 5000]])
        const params: JsonObject = {
          p_owner_id: userId,
          p_name: name,
          p_os: os,
          p_photo_url: optionalString(input, 'photoUrl'),
          p_notes: notes,
          p_components: components(input),
          p_moderated_at: moderatedAt,
        }
        if (action === 'updateRig') params.p_rig_id = requiredString(body, 'id')
        const functionName = action === 'createRig' ? 'create_moderated_rig' : 'update_moderated_rig'
        const { data, error } = await ctx.supabaseAdmin.rpc(functionName, params)
        if (error) throw databaseError(error)
        return json({ id: String(data) })
      }

      if (action === 'createResult' || action === 'updateResult') {
        const partial = action === 'updateResult'
        moderate([
          ['runtimeVersion', partial && !('runtimeVersion' in input) ? null : requiredString(input, 'runtimeVersion'), 80],
          ['notes', optionalString(input, 'notes'), 5000],
        ])
        const values = {
          ...resultValues(input, partial),
          moderated_at: moderatedAt,
          ...(partial ? {} : { submitter_id: userId }),
        }
        const query = partial
          ? ctx.supabaseAdmin.from('results').update(values).eq('id', requiredString(body, 'id')).eq('submitter_id', userId)
          : ctx.supabaseAdmin.from('results').insert(values)
        const { data, error } = await query.select('id').maybeSingle()
        if (error) throw databaseError(error)
        if (!data) throw new RequestError(404, 'not_found', 'Result not found or not owned by this user.')
        return json({ id: String(data.id) })
      }

      throw new RequestError(400, 'validation', 'Unknown moderation action.')
    } catch (error) {
      const requestError = error instanceof RequestError
        ? error
        : new RequestError(500, 'internal_error', 'Could not save your changes.')
      return json({ error: { code: requestError.code, message: requestError.message, fields: requestError.fields } }, requestError.status)
    }
  }),
}
