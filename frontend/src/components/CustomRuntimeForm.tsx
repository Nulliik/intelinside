import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { api } from '@/lib/api'
import { useCatalog } from '@/hooks/useCatalog'
import { ApiError, BUILD_SUMMARY_MAX, type CustomRuntime } from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * Registering a custom runtime, inline wherever it is needed — the same shape RigForm takes inside the submit
 * page, so nobody leaves a half-filled result to go and create one somewhere else.
 */
export function CustomRuntimeForm({
  build,
  runtimeId,
  onCreated,
  onCancel,
}: {
  /** Present when editing. Absent registers a new one. */
  build?: CustomRuntime
  runtimeId?: string
  onCreated: (build: CustomRuntime) => void
  onCancel?: () => void
}) {
  const cat = useCatalog()
  const runtimes = cat.data?.runtimes ?? []
  const [runtime, setRuntime] = useState(build?.runtimeId ?? runtimeId ?? '')
  const [name, setName] = useState(build?.name ?? '')
  const [repoUrl, setRepoUrl] = useState(build?.repoUrl ?? '')
  const [summary, setSummary] = useState(build?.summary ?? '')
  const [notes, setNotes] = useState(build?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const next: Record<string, string> = {}
    if (!runtime) next.runtimeId = 'Pick the runtime it is based on.'
    if (!name.trim()) next.name = 'Name it.'
    if (!/^https?:\/\/\S+$/.test(repoUrl.trim())) next.repoUrl = 'Enter a full URL, starting with https://.'
    if (!summary.trim()) next.summary = 'Say in one line what changed.'
    else if (summary.trim().length > BUILD_SUMMARY_MAX) next.summary = `Use ${BUILD_SUMMARY_MAX} characters or fewer.`
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    const input = { runtimeId: runtime, name: name.trim(), repoUrl: repoUrl.trim(), summary: summary.trim(), notes: notes.trim() || undefined }
    try {
      onCreated(build ? await api.updateCustomRuntime(build.id, input) : await api.createCustomRuntime(input))
    } catch (error) {
      setErrors(error instanceof ApiError && error.fields ? error.fields : { name: 'Could not save it. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="cr-name" label="Name" error={errors.name} hint="Short, yours, and stable. It titles its page.">
          <Input id="cr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="fused-attn-b60" aria-invalid={!!errors.name} />
        </FormField>
        <FormField id="cr-runtime" label="Based on" error={errors.runtimeId}>
          <NativeSelect className="w-full" id="cr-runtime" value={runtime} aria-invalid={!!errors.runtimeId} onChange={(e) => setRuntime(e.target.value)}>
            <NativeSelectOption value="">Pick a runtime</NativeSelectOption>
            {runtimes.map((r) => (
              <NativeSelectOption key={r.id} value={r.id}>{r.name}</NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <FormField id="cr-repo" label="Fork or source" error={errors.repoUrl}>
        <Input id="cr-repo" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/you/vllm" aria-invalid={!!errors.repoUrl} />
      </FormField>
      <FormField
        id="cr-summary"
        label="What changed"
        error={errors.summary}
        hint="One line. It is what the picker and the board row show, so it cannot be blank."
      >
        <Input id="cr-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Fused RMSNorm + QKV, tuned for Arc Pro B60 at batch 1" aria-invalid={!!errors.summary} />
      </FormField>
      <FormField id="cr-notes" label="Notes" error={errors.notes} hint="Optional. What you tried, what did not help, how to compile it.">
        <Textarea id="cr-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
      </FormField>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={save} disabled={busy}>{busy ? 'Saving…' : build ? 'Save changes' : 'Save custom runtime'}</Button>
        {onCancel ? <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button> : null}
      </div>
    </div>
  )
}

function FormField({ id, label, error, hint, className, children }: { id: string; label: string; error?: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
