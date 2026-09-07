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
 * Registering a build, inline wherever it is needed — the same shape RigForm takes inside the submit page, so
 * nobody leaves a half-filled result to go and create one somewhere else.
 */
export function BuildForm({
  runtimeId,
  onCreated,
  onCancel,
}: {
  runtimeId?: string
  onCreated: (build: CustomRuntime) => void
  onCancel?: () => void
}) {
  const cat = useCatalog()
  const runtimes = cat.data?.runtimes ?? []
  const [runtime, setRuntime] = useState(runtimeId ?? '')
  const [name, setName] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const next: Record<string, string> = {}
    if (!runtime) next.runtimeId = 'Pick the runtime it is based on.'
    if (!name.trim()) next.name = 'Name the build.'
    if (!/^https?:\/\/\S+$/.test(repoUrl.trim())) next.repoUrl = 'Enter a full URL, starting with https://.'
    if (!summary.trim()) next.summary = 'Say in one line what changed.'
    else if (summary.trim().length > BUILD_SUMMARY_MAX) next.summary = `Use ${BUILD_SUMMARY_MAX} characters or fewer.`
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      onCreated(await api.createCustomRuntime({ runtimeId: runtime, name: name.trim(), repoUrl: repoUrl.trim(), summary: summary.trim(), notes: notes.trim() || undefined }))
    } catch (error) {
      setErrors(error instanceof ApiError && error.fields ? error.fields : { name: 'Could not save the build. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="build-name" label="Name" error={errors.name} hint="Short, yours, and stable. It titles the build's page.">
          <Input id="build-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="fused-attn-b60" aria-invalid={!!errors.name} />
        </FormField>
        <FormField id="build-runtime" label="Based on" error={errors.runtimeId}>
          <NativeSelect className="w-full" id="build-runtime" value={runtime} aria-invalid={!!errors.runtimeId} onChange={(e) => setRuntime(e.target.value)}>
            <NativeSelectOption value="">Pick a runtime</NativeSelectOption>
            {runtimes.map((r) => (
              <NativeSelectOption key={r.id} value={r.id}>{r.name}</NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <FormField id="build-repo" label="Fork or source" error={errors.repoUrl}>
        <Input id="build-repo" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/you/vllm" aria-invalid={!!errors.repoUrl} />
      </FormField>
      <FormField
        id="build-summary"
        label="What changed"
        error={errors.summary}
        hint="One line. It is what the picker and the board row show, so it cannot be blank."
      >
        <Input id="build-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Fused RMSNorm + QKV, tuned for Arc Pro B60 at batch 1" aria-invalid={!!errors.summary} />
      </FormField>
      <FormField id="build-notes" label="Notes" error={errors.notes} hint="Optional. What you tried, what did not help, how to build it.">
        <Textarea id="build-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
      </FormField>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save build'}</Button>
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
