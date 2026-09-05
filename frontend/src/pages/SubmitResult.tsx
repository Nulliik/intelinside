import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Share2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/PageHeader'
import { ResultCard } from '@/components/ResultCard'
import { RigForm } from '@/components/RigForm'
import { ShareDialog } from '@/components/ShareDialog'
import { SignInGate } from '@/components/SignInGate'
import { ErrorState } from '@/components/ErrorState'
import { Block, PillTabs, Section, inset } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import { isGitHubUrl } from '@/lib/github'
import { UNIT_LABEL, hasDiscreteGpu, hostIn, integratedParts, nestParts, unitLabel } from '@/lib/hardware'
import { ApiError, type Result, type ResultInput, type ResultRank } from '@/lib/api/types'
import { fmtTps } from '@/lib/format'
import { resultShareTarget } from '@/lib/share'
import { cn } from '@/lib/utils'

type Target = 'rig' | 'component'
type Form = {
  rigId: string
  target: Target
  componentId: string
  componentQuantity: string
  modelId: string
  quant: string
  runtimeId: string
  runtimeVersion: string
  decodeTps: string
  promptTps: string
  ttftMs: string
  contextLength: string
  batchSize: string
  repoUrl: string
  runDate: string
  notes: string
}

const today = () => new Date().toISOString().slice(0, 10)
const EMPTY: Form = {
  rigId: '', target: 'rig', componentId: '', componentQuantity: '1', modelId: '', quant: '', runtimeId: '', runtimeVersion: '',
  decodeTps: '', promptTps: '', ttftMs: '', contextLength: '', batchSize: '', repoUrl: '', runDate: today(), notes: '',
}
const num = (s: string) => (s.trim() === '' ? undefined : Number(s))
const isoAtNoon = (day: string) => new Date(`${day}T12:00:00`).toISOString()

/** Mirrors the server's rules so the form can flag problems before the request. */
function validate(f: Form, quantsFor: string[]): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.rigId) e.rigId = 'Pick a rig.'
  if (f.target === 'component' && !f.componentId) e.componentId = 'Pick the part it ran on.'
  if (f.target === 'component' && !(Number(f.componentQuantity) >= 1)) e.componentQuantity = 'How many of that part were used?'
  if (!f.modelId) e.modelId = 'Pick a model.'
  if (!f.quant) e.quant = 'Pick a quantization.'
  else if (quantsFor.length && !quantsFor.includes(f.quant)) e.quant = 'That quant has no board for this model.'
  if (!f.runtimeId) e.runtimeId = 'Pick a runtime.'
  if (!f.runtimeVersion.trim()) e.runtimeVersion = 'Enter the runtime version.'
  const d = num(f.decodeTps)
  if (d == null || Number.isNaN(d) || !(d > 0)) e.decodeTps = 'Enter decode tok/s above zero.'
  for (const k of ['promptTps', 'ttftMs', 'contextLength', 'batchSize'] as const) {
    const v = num(f[k])
    if (v != null && (Number.isNaN(v) || v < 0)) e[k] = 'Must be zero or more.'
  }
  if (!isGitHubUrl(f.repoUrl.trim())) e.repoUrl = 'Enter a GitHub URL, starting with https://github.com/.'
  if (!f.runDate) e.runDate = 'Enter the run date.'
  else if (f.runDate > today()) e.runDate = 'Run date cannot be in the future.'
  return e
}

function toInput(f: Form): ResultInput {
  const component = f.target === 'component'
  return {
    modelId: f.modelId,
    quant: f.quant,
    runtimeId: f.runtimeId,
    runtimeVersion: f.runtimeVersion.trim(),
    rigId: f.rigId,
    componentId: component ? f.componentId : undefined,
    componentQuantity: component ? Number(f.componentQuantity) || 1 : undefined,
    decodeTps: Number(f.decodeTps),
    promptTps: num(f.promptTps),
    ttftMs: num(f.ttftMs),
    contextLength: num(f.contextLength),
    batchSize: num(f.batchSize),
    notes: f.notes.trim() || undefined,
    repoUrl: f.repoUrl.trim(),
    runDate: isoAtNoon(f.runDate),
  }
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={cn('border-b py-6', inset)}>
      <div className="mb-4">
        <h2 className="font-sans text-xs font-medium uppercase tracking-label text-muted-foreground">
          <span className="font-mono">{n}</span> · {title}
        </h2>
        {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}

function Field({ id, label, error, hint, className, children }: { id: string; label: string; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

/** Submit a result, or edit one when `mode` is "edit" and the route carries a resultId. */
export default function SubmitResult({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const { resultId } = useParams()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading } = useSession()
  const cat = useCatalog()
  const [rigsTick, setRigsTick] = useState(0)
  const myRigs = useAsync(() => (user ? api.rigs({ owner: user.handle, limit: 100 }) : Promise.resolve(null)), [user?.handle, rigsTick])
  const existing = useAsync(() => (mode === 'edit' && resultId ? api.result(resultId) : Promise.resolve(null)), [mode, resultId])
  const [form, setForm] = useState<Form>(() => ({ ...EMPTY, rigId: sp.get('rig') ?? '', modelId: sp.get('model') ?? '', quant: sp.get('quant') ?? '' }))
  const [initialized, setInitialized] = useState(mode === 'create')
  const [creatingRig, setCreatingRig] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ result: Result; rank?: ResultRank } | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))

  usePageTitle(mode === 'edit' ? 'Edit result' : 'Submit a result')

  // Prefill from the existing result when editing.
  useEffect(() => {
    if (mode !== 'edit' || !existing.data || initialized) return
    const r = existing.data
    setForm({
      rigId: r.rigId, target: r.componentId ? 'component' : 'rig', componentId: r.componentId ?? '', componentQuantity: String(r.componentQuantity ?? 1),
      modelId: r.modelId, quant: r.quant, runtimeId: r.runtimeId, runtimeVersion: r.runtimeVersion,
      decodeTps: String(r.decodeTps), promptTps: r.promptTps?.toString() ?? '', ttftMs: r.ttftMs?.toString() ?? '',
      contextLength: r.contextLength?.toString() ?? '', batchSize: r.batchSize?.toString() ?? '',
      repoUrl: r.repoUrl, runDate: r.runDate.slice(0, 10), notes: r.notes ?? '',
    })
    setInitialized(true)
  }, [mode, existing.data, initialized])

  // Preselect the only rig, or open the rig form when there is none.
  const rigItems = myRigs.data?.items ?? null
  useEffect(() => {
    if (!rigItems) return
    if (rigItems.length === 0) setCreatingRig(true)
    else if (rigItems.length === 1) setForm((f) => (f.rigId ? f : { ...f, rigId: rigItems[0].id }))
  }, [rigItems])

  const rigDetail = useAsync(() => (form.rigId ? api.rig(form.rigId) : Promise.resolve(null)), [form.rigId])
  const model = cat.data?.models.find((m) => m.id === form.modelId)
  const quantsFor = model?.quants ?? []
  const quantKey = quantsFor.join(',')

  // Drop a quant that the chosen model has no board for.
  useEffect(() => {
    setForm((f) => (f.quant && quantsFor.length && !quantsFor.includes(f.quant) ? { ...f, quant: '' } : f))
  }, [quantKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Live validation once the first attempt has been made.
  useEffect(() => {
    if (attempted) setErrors(validate(form, quantsFor))
  }, [form, attempted, quantKey]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || cat.loading || (mode === 'edit' && existing.loading))
    return (
      <Block>
        <Skeleton className="h-96" />
      </Block>
    )
  if (!user) return <SignInGate what={mode === 'edit' ? 'edit this result' : 'submit a result'} />
  if (cat.error || !cat.data)
    return (
      <Block>
        <ErrorState error={cat.error ?? new Error('Catalog unavailable.')} />
      </Block>
    )
  if (mode === 'edit') {
    if (existing.error)
      return (
        <Block>
          <ErrorState error={existing.error} />
        </Block>
      )
    if (existing.data && existing.data.submitterId !== user.id)
      return (
        <Block>
          <ErrorState error={new Error('Only the submitter can edit this result.')} />
        </Block>
      )
  }

  const { models, quants, runtimes } = cat.data
  const rigs = rigItems ?? []
  const selectedRig = rigs.find((r) => r.id === form.rigId)
  const components = rigDetail.data?.components ?? []
  const selectedComponent = components.find((c) => c.hardwareId === form.componentId)
  const selectedHost = form.componentId ? hostIn(components, form.componentId) : undefined
  // A chip that carries an iGPU or NPU: without a discrete GPU, "whole rig" is ambiguous about which unit ran the model.
  const chip = components.map((c) => c.hardware).find((h) => h && integratedParts(h).length > 0)
  const chipUnits = integratedParts(chip)
  const askForUnit = form.target === 'rig' && !!chip && !hasDiscreteGpu(components)
  const partHint = !selectedComponent?.hardware
    ? undefined
    : selectedComponent.hardware.type === 'cpu' && integratedParts(selectedComponent.hardware).length
      ? `CPU cores only. The ${integratedParts(selectedComponent.hardware).map((p) => UNIT_LABEL[p.type]).join(' and ')} on this chip ${integratedParts(selectedComponent.hardware).length > 1 ? 'are their own parts' : 'is its own part'}.`
      : selectedHost
        ? `The ${unitLabel(selectedComponent.hardware, selectedHost)}. It ranks apart from the CPU cores.`
        : undefined
  const quantLabel = (id: string) => quants.find((q) => q.id === id)?.label ?? id

  const preview: Result = {
    id: existing.data?.id ?? 'preview',
    submitterId: user.id,
    submitter: user,
    modelId: form.modelId,
    quant: form.quant,
    runtimeId: form.runtimeId,
    runtimeVersion: form.runtimeVersion,
    rigId: form.rigId,
    rig: selectedRig,
    componentId: form.target === 'component' ? form.componentId || undefined : undefined,
    componentQuantity: form.target === 'component' ? Number(form.componentQuantity) || 1 : undefined,
    component: form.target === 'component' ? selectedComponent?.hardware : undefined,
    componentHost: form.target === 'component' ? selectedHost : undefined,
    decodeTps: num(form.decodeTps) ?? 0,
    promptTps: num(form.promptTps),
    ttftMs: num(form.ttftMs),
    contextLength: num(form.contextLength),
    batchSize: num(form.batchSize),
    notes: form.notes.trim() || undefined,
    repoUrl: form.repoUrl.trim(),
    runDate: form.runDate ? isoAtNoon(form.runDate) : '',
    verification: existing.data?.verification ?? { status: 'self_reported', confirmations: 0 },
    moderation: existing.data?.moderation ?? { flags: 0, hidden: false },
    createdAt: '',
    updatedAt: '',
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setAttempted(true)
    const e = validate(form, quantsFor)
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error('Fix the highlighted fields.')
      return
    }
    setBusy(true)
    try {
      const input = toInput(form)
      if (mode === 'edit' && resultId) {
        await api.updateResult(resultId, input)
        toast.success('Result updated. Verification was reset.')
        navigate(`/results/${resultId}`)
      } else {
        const created = await api.createResult(input)
        const detail = await api.result(created.id)
        setDone({ result: detail, rank: detail.rank })
        window.scrollTo({ top: 0 })
      }
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields)
      toast.error(err instanceof ApiError ? err.message : 'That did not go through. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    const r = done.result
    const m = models.find((x) => x.id === r.modelId)
    return (
      <div>
        <PageHeader
          eyebrow="Submitted"
          title={
            <>
              <span className="font-mono">{fmtTps(r.decodeTps)}</span> tok/s is on the board.
            </>
          }
          description={done.rank ? `#${done.rank.position} of ${done.rank.boardSize} on the ${m?.name ?? r.modelId} ${quantLabel(r.quant)} ${done.rank.kind} board. It starts as self-reported; the community can confirm it.` : undefined}
          actions={
            <>
              <Button variant="outline" onClick={() => setShareOpen(true)}>
                <Share2 data-icon="inline-start" /> Share
              </Button>
              <Button render={<Link to={`/results/${r.id}`} />} nativeButton={false}>
                View result
              </Button>
              <ShareDialog target={resultShareTarget(r, { models, quants, runtimes }, done.rank)} open={shareOpen} onOpenChange={setShareOpen} />
            </>
          }
        />
        <Section rule="both">
          <ResultCard
            result={r}
            rank={done.rank}
            models={models}
            quants={quants}
            runtimes={runtimes}
            footer={
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" render={<Link to={`/models/${r.modelId}/${r.quant}?kind=${done.rank?.kind ?? 'rigs'}`} />} nativeButton={false}>
                  Open the board
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDone(null)
                    setAttempted(false)
                    setErrors({})
                    setForm({ ...EMPTY, rigId: form.rigId, runtimeId: form.runtimeId, runtimeVersion: form.runtimeVersion })
                  }}
                >
                  Submit another
                </Button>
              </div>
            }
          />
        </Section>
      </div>
    )
  }

  const inputProps = (k: keyof Form) => ({
    id: k,
    value: form[k],
    'aria-invalid': !!errors[k],
    onChange: (e: { target: { value: string } }) => set({ [k]: e.target.value } as Partial<Form>),
  })

  return (
    <div>
      <PageHeader
        eyebrow={mode === 'edit' ? 'Edit result' : 'Submit a result'}
        title={
          mode === 'edit' ? (
            'Edit result'
          ) : (
            <>
              One model, one runtime, one machine.
            </>
          )
        }
        description="Decode tokens per second is what ranks. Everything else is optional but welcome."
      />
      {mode === 'edit' ? (
        <Block className="pt-0 pb-6">
          <Alert>
            <AlertTitle>Edits reset verification</AlertTitle>
            <AlertDescription>Saving clears any confirmations and returns the result to self-reported, so the community can check the new numbers.</AlertDescription>
          </Alert>
        </Block>
      ) : null}
      <Section rule="both">
        <form onSubmit={onSubmit} noValidate className="grid gap-px bg-border lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0 bg-background">
            <Step n={1} title="Rig" hint="Results attach to a rig you own. Add one if it is missing.">
              <Field id="rigId" label="Rig" error={errors.rigId}>
                <div className="flex flex-wrap items-center gap-2">
                  <NativeSelect className="w-72" id="rigId" value={form.rigId} aria-invalid={!!errors.rigId} onChange={(e) => set({ rigId: e.target.value, componentId: '', componentQuantity: '1' })}>
                    <NativeSelectOption value="">{rigs.length ? 'Pick a rig' : 'No rigs yet'}</NativeSelectOption>
                    {rigs.map((r) => (
                      <NativeSelectOption key={r.id} value={r.id}>
                        {r.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <Button type="button" variant="outline" onClick={() => setCreatingRig((v) => !v)}>
                    {creatingRig ? 'Cancel new rig' : 'New rig'}
                  </Button>
                </div>
                {selectedRig ? <p className="text-xs text-muted-foreground">{selectedRig.summary}</p> : null}
              </Field>
              {creatingRig ? (
                <div className="rounded-lg border p-4">
                  <div className="mb-4 text-sm font-medium">{rigs.length ? 'Create another rig' : 'You have no rigs yet. Create the first one.'}</div>
                  <RigForm
                    inline
                    submitLabel="Create rig"
                    onSaved={(rig) => {
                      setRigsTick((t) => t + 1)
                      set({ rigId: rig.id, componentId: '', componentQuantity: '1' })
                      setCreatingRig(false)
                    }}
                    onCancel={rigs.length ? () => setCreatingRig(false) : undefined}
                  />
                </div>
              ) : null}
            </Step>

            <Step n={2} title="Target" hint="Whole rig, or one part inside it. Each ranks on its own board.">
              <PillTabs<Target> className="-ml-3" value={form.target} onChange={(v) => set({ target: v })} items={[{ value: 'rig', label: 'Whole rig' }, { value: 'component', label: 'One part' }]} />
              {askForUnit && chip ? (
                <p className="max-w-prose text-xs text-muted-foreground">
                  No discrete GPU here, and the {chip.name} carries {chipUnits.map((p) => `an ${UNIT_LABEL[p.type]}`).join(' and ')} beside its cores. If the run used one unit, submit it as a part so each ranks on its own.
                </p>
              ) : null}
              {form.target === 'component' ? (
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                  <Field id="componentId" label="Part" error={errors.componentId} hint={partHint}>
                    <NativeSelect className="w-full" id="componentId" value={form.componentId} disabled={!form.rigId} aria-invalid={!!errors.componentId} onChange={(e) => set({ componentId: e.target.value, componentQuantity: '1' })}>
                      <NativeSelectOption value="">{form.rigId ? 'Pick a part' : 'Pick a rig first'}</NativeSelectOption>
                      {nestParts(components).map(({ part: c, host }) => (
                        <NativeSelectOption key={c.hardwareId} value={c.hardwareId}>
                          {c.quantity > 1 ? `${c.quantity}× ` : ''}
                          {c.hardware?.name ?? c.hardwareId}
                          {c.hardware ? ` · ${unitLabel(c.hardware, host)}` : ''}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field id="componentQuantity" label="Quantity used" error={errors.componentQuantity} hint={selectedComponent && selectedComponent.quantity > 1 ? `Up to ${selectedComponent.quantity} in this rig` : undefined}>
                    <Input {...inputProps('componentQuantity')} type="number" min={1} max={selectedComponent?.quantity ?? 64} inputMode="numeric" />
                  </Field>
                </div>
              ) : null}
            </Step>

            <Step n={3} title="Model" hint="Each model and quantization is its own board.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="modelId" label="Model" error={errors.modelId}>
                  <NativeSelect className="w-full" id="modelId" value={form.modelId} aria-invalid={!!errors.modelId} onChange={(e) => set({ modelId: e.target.value })}>
                    <NativeSelectOption value="">Pick a model</NativeSelectOption>
                    {models.map((m) => (
                      <NativeSelectOption key={m.id} value={m.id}>
                        {m.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field id="quant" label="Quantization" error={errors.quant}>
                  <NativeSelect className="w-full" id="quant" value={form.quant} disabled={!form.modelId} aria-invalid={!!errors.quant} onChange={(e) => set({ quant: e.target.value })}>
                    <NativeSelectOption value="">{form.modelId ? 'Pick a quant' : 'Pick a model first'}</NativeSelectOption>
                    {quantsFor.map((q) => (
                      <NativeSelectOption key={q} value={q}>
                        {quantLabel(q)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
            </Step>

            <Step n={4} title="Runtime" hint="The engine that produced the number, with its version.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="runtimeId" label="Runtime" error={errors.runtimeId}>
                  <NativeSelect className="w-full" id="runtimeId" value={form.runtimeId} aria-invalid={!!errors.runtimeId} onChange={(e) => set({ runtimeId: e.target.value })}>
                    <NativeSelectOption value="">Pick a runtime</NativeSelectOption>
                    {runtimes.map((r) => (
                      <NativeSelectOption key={r.id} value={r.id}>
                        {r.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field id="runtimeVersion" label="Version" error={errors.runtimeVersion}>
                  <Input {...inputProps('runtimeVersion')} placeholder="0.10.0, or b6512 for llama.cpp" className="font-mono" />
                </Field>
              </div>
            </Step>

            <Step n={5} title="Numbers" hint="Decode speed ranks. Average a few runs of at least 256 tokens.">
              <Field id="decodeTps" label="Decode tok/s" error={errors.decodeTps} className="max-w-xs">
                <Input {...inputProps('decodeTps')} type="number" min={0} step="any" inputMode="decimal" placeholder="42.5" className="font-mono text-base" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field id="promptTps" label="Prompt tok/s" error={errors.promptTps}>
                  <Input {...inputProps('promptTps')} type="number" min={0} step="any" inputMode="decimal" placeholder="Optional" className="font-mono" />
                </Field>
                <Field id="ttftMs" label="Time to first token (ms)" error={errors.ttftMs}>
                  <Input {...inputProps('ttftMs')} type="number" min={0} step="any" inputMode="decimal" placeholder="Optional" className="font-mono" />
                </Field>
                <Field id="contextLength" label="Context length" error={errors.contextLength}>
                  <Input {...inputProps('contextLength')} type="number" min={0} step={1} inputMode="numeric" placeholder="4096" className="font-mono" />
                </Field>
                <Field id="batchSize" label="Batch size" error={errors.batchSize}>
                  <Input {...inputProps('batchSize')} type="number" min={0} step={1} inputMode="numeric" placeholder="1" className="font-mono" />
                </Field>
              </div>
            </Step>

            <Step n={6} title="Evidence" hint="Link the repo you ran in, yours or the runtime's, so others can reproduce it.">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
                <Field id="repoUrl" label="Repo link" error={errors.repoUrl}>
                  <Input {...inputProps('repoUrl')} type="url" placeholder="https://github.com/you/bench" />
                </Field>
                <Field id="runDate" label="Run date" error={errors.runDate}>
                  <Input {...inputProps('runDate')} type="date" max={today()} />
                </Field>
              </div>
              <Field id="notes" label="Notes" error={errors.notes} hint="Drivers, cooling, settings, anything that explains the number.">
                <Textarea {...inputProps('notes')} rows={3} placeholder="Optional" />
              </Field>
            </Step>

            <div className={cn('flex flex-wrap items-center gap-2 py-5', inset)}>
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? 'Submitting…' : mode === 'edit' ? 'Save changes' : 'Submit result'}
              </Button>
              {mode === 'edit' && resultId ? (
                <Button variant="ghost" render={<Link to={`/results/${resultId}`} />} nativeButton={false}>
                  Cancel
                </Button>
              ) : null}
              {attempted && Object.keys(errors).length ? <span className="text-sm text-destructive">Fix the highlighted fields.</span> : null}
            </div>
          </div>

          <aside className="min-w-0 bg-background" aria-label="Preview">
            <div className="lg:sticky lg:top-14">
              <ResultCard result={preview} compact eyebrow="Preview" models={models} quants={quants} runtimes={runtimes} />
            </div>
          </aside>
        </form>
      </Section>
    </div>
  )
}
