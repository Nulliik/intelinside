import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronDown, GitPullRequest, Info, Share2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import { RESULTS_REPO, RESULTS_REPO_URL } from '@/lib/brand'
import { isGitHubUrl } from '@/lib/github'
import { PrError, fetchPrResults, newResultFileUrl, parsePrRef, resultFileFor, type PrResultFile, type PrResults, type ResultFile } from '@/lib/pr'
import { UNIT_LABEL, hasDiscreteGpu, hostIn, integratedParts, nestParts, unitLabel } from '@/lib/hardware'
import { ApiError, type Result, type ResultInput, type ResultRank, type RigSummary } from '@/lib/api/types'
import { fmtTps, pluralize } from '@/lib/format'
import { resultShareTarget } from '@/lib/share'
import { cn } from '@/lib/utils'
import { HARDWARE_BY_ID, MODEL_BY_ID, QUANT_BY_ID, RUNTIME_BY_ID } from '@/mocks/catalog'

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

/** Fills the form from a result file. Ids the catalog does not know stay blank and are reported, so the rest still lands. */
function formFromFile(file: Partial<ResultFile>, rigs: RigSummary[], evidenceUrl: string, prev: Form): { form: Form; problems: string[] } {
  const problems: string[] = []
  const wanted = file.rig?.toLowerCase()
  const rig = wanted ? rigs.find((r) => r.id.toLowerCase() === wanted) ?? rigs.find((r) => r.name.toLowerCase() === wanted) : undefined
  if (file.rig && !rig) problems.push(`The file names rig "${file.rig}", which is not one of your rigs. Pick one below.`)
  const text = (value: number | undefined) => (value == null ? '' : String(value))
  return {
    problems,
    form: {
      ...prev,
      rigId: rig?.id ?? '',
      target: file.component ? 'component' : 'rig',
      componentId: file.component && HARDWARE_BY_ID[file.component] ? file.component : '',
      componentQuantity: text(file.componentQuantity) || '1',
      modelId: file.model && MODEL_BY_ID[file.model] ? file.model : '',
      quant: file.quant && QUANT_BY_ID[file.quant] ? file.quant : '',
      runtimeId: file.runtime && RUNTIME_BY_ID[file.runtime] ? file.runtime : '',
      runtimeVersion: file.runtimeVersion ?? '',
      decodeTps: text(file.decodeTps),
      promptTps: text(file.promptTps),
      ttftMs: text(file.ttftMs),
      contextLength: text(file.contextLength),
      batchSize: text(file.batchSize),
      repoUrl: evidenceUrl,
      runDate: file.runDate ?? prev.runDate,
      notes: file.notes ?? '',
    },
  }
}

/** One line to tell a PR's result files apart: the part or whole rig, the model and quant, and the decode speed. */
function fileSummary({ file }: PrResultFile): string {
  return [
    file.component ? HARDWARE_BY_ID[file.component]?.name ?? file.component : 'Whole rig',
    file.model ? `${MODEL_BY_ID[file.model]?.name ?? file.model}${file.quant ? ` ${QUANT_BY_ID[file.quant]?.label ?? file.quant}` : ''}` : undefined,
    file.decodeTps != null ? `${fmtTps(file.decodeTps)} tok/s` : undefined,
  ]
    .filter(Boolean)
    .join(' · ')
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
  const [prInput, setPrInput] = useState(sp.get('pr') ?? '')
  const [pr, setPr] = useState<PrResults | null>(null)
  const [prFile, setPrFile] = useState(0)
  const [prProblems, setPrProblems] = useState<string[]>([])
  const [prBusy, setPrBusy] = useState(false)
  const [prError, setPrError] = useState<string | null>(null)
  const [prAuto, setPrAuto] = useState(false)
  const [prOpen, setPrOpen] = useState(false)
  const [howOpen, setHowOpen] = useState(false)
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))

  usePageTitle(mode === 'edit' ? 'Edit result' : 'Submit a result')
  // The prefill dialog is a bottom sheet on phones, like the share dialog.
  const phone = useMediaQuery('(max-width: 639px)')

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

  // Prefill from a pull request on the site's repo: read its result files, fill what the catalog knows, keep the PR as evidence.
  const applyPrFile = (results: PrResults, index: number) => {
    const chosen = results.files[index]
    const filled = formFromFile(chosen.file, rigItems ?? [], results.pr.url, form)
    setForm(filled.form)
    setPrFile(index)
    setPrProblems([...chosen.problems, ...filled.problems])
    setAttempted(false)
    setErrors({})
  }
  /** `auto` is the `?pr=N` case: success shows the status strip without the dialog, failure opens the dialog on the error. */
  const prefill = async (input: string, auto = false) => {
    const ref = parsePrRef(input)
    if (!ref) {
      setPrError(`Enter a pull request number or link on ${RESULTS_REPO}.`)
      if (auto) setPrOpen(true)
      return
    }
    setPrBusy(true)
    setPrError(null)
    try {
      const results = await fetchPrResults(ref)
      setPr(results)
      applyPrFile(results, 0)
    } catch (error) {
      setPr(null)
      setPrError(error instanceof PrError ? error.message : 'Could not reach GitHub.')
      if (auto) setPrOpen(true)
    } finally {
      setPrBusy(false)
    }
  }
  /** Forget the pull request and start the form over. */
  const clearPr = () => {
    setPr(null)
    setPrProblems([])
    setPrError(null)
    setPrInput('')
    setAttempted(false)
    setErrors({})
    setForm({ ...EMPTY, rigId: rigItems?.length === 1 ? rigItems[0].id : '' })
  }
  // `?pr=N`, the link the repo's check comments on each pull request, prefills once the rigs are known.
  const prParam = sp.get('pr')
  useEffect(() => {
    if (mode !== 'create' || !prParam || !rigItems || prAuto) return
    setPrAuto(true)
    void prefill(prParam, true)
  }, [mode, prParam, rigItems, prAuto]) // eslint-disable-line react-hooks/exhaustive-deps

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
              <Button
                variant="outline"
                render={<a href={newResultFileUrl(user.handle, resultFileFor(r, `${window.location.origin}/results/${r.id}`))} target="_blank" rel="noreferrer" />}
                nativeButton={false}
              >
                <GitPullRequest data-icon="inline-start" /> Add to the results repo
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

  const prefillDescription = (
    <>
      Opened a pull request to{' '}
      <a href={RESULTS_REPO_URL} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
        {RESULTS_REPO}
      </a>{' '}
      with a result file?{' '}
      <br className="hidden sm:block" />
      Paste its link and the form fills itself.
    </>
  )
  const prefillBody = (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={prInput}
          onChange={(e) => setPrInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void prefill(prInput)
            }
          }}
          placeholder={`${RESULTS_REPO_URL}/pull/12`}
          aria-label="Pull request link or number"
          aria-invalid={!!prError}
          className="min-w-0 flex-1"
          autoFocus
        />
        <Button type="button" disabled={prBusy || !prInput.trim()} onClick={() => void prefill(prInput)}>
          {prBusy ? 'Reading…' : 'Prefill'}
        </Button>
      </div>
      {prError ? <p className="text-xs text-destructive">{prError}</p> : null}
      {pr ? (
        <div className="grid gap-2 rounded-lg border p-3 text-sm">
          <div className="min-w-0">
            Prefilled from{' '}
            <a href={pr.pr.url} target="_blank" rel="noreferrer" className="font-medium hover:underline underline-offset-4">
              #{pr.pr.number}
            </a>
            <span className="text-muted-foreground">
              {' '}· {pr.pr.title} · opened by @{pr.pr.author}
            </span>
          </div>
          {pr.files.length > 1 ? (
            <fieldset className="-mx-1 grid gap-0.5">
              <legend className="sr-only">Result file to fill the form from</legend>
              {pr.files.map((f, i) => (
                <label
                  key={f.path}
                  className={cn('flex min-w-0 cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50', i === prFile && 'bg-muted/50')}
                >
                  <input type="radio" name="pr-file" value={i} checked={i === prFile} onChange={() => applyPrFile(pr, i)} className="mt-1 size-3.5 shrink-0 accent-primary" />
                  <span className="min-w-0">
                    <span className="block truncate">
                      {fileSummary(f)}
                      {f.problems.length ? <span className="text-destructive"> · {pluralize(f.problems.length, 'problem')}</span> : null}
                    </span>
                    <span className="block truncate font-mono text-xs text-muted-foreground">{f.path.replace(/^results\//, '')}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <div className="font-mono text-xs text-muted-foreground">{pr.files[0].path}</div>
          )}
          {pr.pr.author.toLowerCase() !== user.handle.toLowerCase() ? (
            <p className="text-xs text-muted-foreground">Opened by @{pr.pr.author}, not you. Results are your own runs on your own rig.</p>
          ) : null}
          {prProblems.length ? (
            <ul className="list-disc pl-5 text-xs text-destructive">
              {prProblems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">The form is filled in. Check the numbers, then submit; the pull request is the evidence link.</p>
          )}
        </div>
      ) : null}
      {pr ? (
        <Button className="w-full" onClick={() => setPrOpen(false)}>
          Done
        </Button>
      ) : null}
      <div className="rounded-lg border text-sm">
        <button
          type="button"
          onClick={() => setHowOpen((open) => !open)}
          aria-expanded={howOpen}
          aria-controls="pr-how-it-works"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-medium outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Info className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex-1">How it works</span>
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', howOpen && 'rotate-180')} aria-hidden />
        </button>
        {/* Height animates through grid rows, so the panel needs no measuring. `inert` keeps the links out of the tab order while closed. */}
        <div
          id="pr-how-it-works"
          inert={!howOpen}
          className={cn('grid transition-[grid-template-rows] duration-200 ease-out', howOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
        >
          <div className="min-h-0 overflow-hidden">
            <div className={cn('grid gap-2 border-t px-3 py-2.5 text-muted-foreground transition-opacity duration-200', howOpen ? 'opacity-100' : 'opacity-0')}>
              <p>
            Add a JSON file under <code className="font-mono text-xs text-foreground">results/your-handle/</code> in{' '}
            <a href={RESULTS_REPO_URL} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
              {RESULTS_REPO}
            </a>{' '}
            and open a pull request. A check validates it against the catalog and comments with a link that opens this form filled in from your file, with the pull request as the evidence link.
          </p>
          <p>
            The format is in the repo's{' '}
            <a href={`${RESULTS_REPO_URL}/tree/main/results`} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
              results folder
            </a>
            . Going the other way, every freshly submitted result offers "Add to the results repo", which writes the file for you.
          </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

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
        actions={
          mode === 'create' ? (
            <Button size="xl" onClick={() => setPrOpen(true)}>
              <GitPullRequest data-icon="inline-start" /> Prefill from a PR
            </Button>
          ) : undefined
        }
      />
      {mode === 'create' ? (
        phone ? (
          <Sheet open={prOpen} onOpenChange={setPrOpen}>
            <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-xl p-4 pb-7">
              <SheetHeader className="p-0 pr-8">
                <SheetTitle>Prefill from a pull request</SheetTitle>
                <SheetDescription>{prefillDescription}</SheetDescription>
              </SheetHeader>
              {prefillBody}
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={prOpen} onOpenChange={setPrOpen}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Prefill from a pull request</DialogTitle>
                <DialogDescription>{prefillDescription}</DialogDescription>
              </DialogHeader>
              {prefillBody}
            </DialogContent>
          </Dialog>
        )
      ) : null}
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
            {mode === 'create' && pr ? (
              <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b bg-card py-3 text-sm', inset)}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    <GitPullRequest className="size-3.5 text-muted-foreground" aria-hidden />
                    <span>
                      Prefilled from{' '}
                      <a href={pr.pr.url} target="_blank" rel="noreferrer" className="font-medium hover:underline underline-offset-4">
                        #{pr.pr.number}
                      </a>
                    </span>
                    <span className="truncate font-mono text-xs text-muted-foreground">{pr.files[prFile]?.path}</span>
                  </div>
                  {pr.pr.author.toLowerCase() !== user.handle.toLowerCase() ? (
                    <p className="mt-1 text-xs text-muted-foreground">Opened by @{pr.pr.author}, not you. Results are your own runs on your own rig.</p>
                  ) : null}
                  {prProblems.length ? (
                    <ul className="mt-1 list-disc pl-5 text-xs text-destructive">
                      {prProblems.map((problem) => (
                        <li key={problem}>{problem}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Check the numbers, then submit. The pull request is the evidence link.</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPrOpen(true)}>
                    Change
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={clearPr}>
                    Clear
                  </Button>
                </div>
              </div>
            ) : null}
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
