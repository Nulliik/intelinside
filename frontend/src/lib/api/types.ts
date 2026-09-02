// Mirrors docs/API.md. Keep the two in sync; this file is the front end's contract.

export type Quant = { id: string; label: string; bits: number; format: string }

export type Model = {
  id: string
  name: string
  family: string
  params: string
  architecture: 'dense' | 'moe'
  activeParams?: string
  sourceUrl: string
  /** Catalog asset. When missing, the UI shows a monogram tile in brandColor. */
  logoUrl?: string
  brandColor?: string
  quants: string[]
  resultCounts?: Record<string, number>
}

export type Runtime = { id: string; name: string; logoUrl: string; repoUrl: string; color: string }

export type HardwareType = 'cpu' | 'gpu' | 'igpu' | 'npu' | 'ram'

export type HardwareItem = {
  id: string
  type: HardwareType
  vendor: string
  name: string
  series?: string
  specs: Record<string, string | number>
  releaseDate?: string
  imageUrl?: string
  source: 'seeded' | 'community'
  resultsCount?: number
  rigsCount?: number
}

export type BestRank = { modelId: string; quant: string; kind: 'rigs' | 'components'; position: number }

export type UserStats = {
  results: number
  rigs: number
  bestRank?: BestRank
  confirmationsGiven: number
}

export type User = {
  id: string
  handle: string
  name?: string
  avatarUrl: string
  bio?: string
  createdAt: string
  tier?: null
  stats?: UserStats
}

export type RigComponent = { hardwareId: string; quantity: number; hardware?: HardwareItem }

export type Rig = {
  id: string
  ownerId: string
  owner?: User
  name: string
  os: string
  photoUrl?: string
  notes?: string
  components: RigComponent[]
  summary: string
  createdAt: string
  updatedAt: string
}

export type RigSummary = Pick<Rig, 'id' | 'name' | 'photoUrl' | 'summary' | 'owner'> & {
  resultsCount: number
  bestTps?: number
}

export type RigInput = Pick<Rig, 'name' | 'os' | 'photoUrl' | 'notes'> & {
  components: { hardwareId: string; quantity: number }[]
}

export type VerificationStatus = 'self_reported' | 'community_verified'
export type Verification = { status: VerificationStatus; confirmations: number; confirmedByMe?: boolean }
export type FlagReason = 'implausible' | 'wrong_hardware' | 'duplicate' | 'spam' | 'other'
export type Moderation = { flags: number; hidden: boolean; flaggedByMe?: boolean; reasons?: FlagReason[] }

export type Result = {
  id: string
  submitterId: string
  submitter?: User
  modelId: string
  quant: string
  runtimeId: string
  runtimeVersion: string
  rigId: string
  rig?: RigSummary
  componentId?: string
  componentQuantity?: number
  component?: HardwareItem
  decodeTps: number
  promptTps?: number
  ttftMs?: number
  contextLength?: number
  batchSize?: number
  notes?: string
  repoUrl: string
  runDate: string
  verification: Verification
  moderation: Moderation
  createdAt: string
  updatedAt: string
}

export type ResultInput = Omit<
  Result,
  'id' | 'submitterId' | 'submitter' | 'rig' | 'component' | 'verification' | 'moderation' | 'createdAt' | 'updatedAt'
>

export type BoardKind = 'rigs' | 'components'
export type BoardMeta = { modelId: string; quant: string; kind: BoardKind; total: number }
export type BoardUnit =
  | { kind: 'rig'; rig: RigSummary }
  | { kind: 'component'; hardware: HardwareItem; quantity: number }
export type BoardRow = { rank: number; result: Result; unit: BoardUnit }
export type ChartBar = { label: string; tps: number; runtimeId: string; href: string }

export type Collection = {
  id: string
  slug: string
  ownerId: string
  owner?: User
  title: string
  description?: string
  coverImageUrl?: string
  items: { hardwareId: string; note?: string; hardware?: HardwareItem }[]
  createdAt: string
  updatedAt: string
}
export type CollectionSummary = Pick<Collection, 'id' | 'slug' | 'title' | 'coverImageUrl' | 'owner'> & {
  itemCount: number
}
export type CollectionInput = Pick<Collection, 'title' | 'description' | 'coverImageUrl'> & {
  slug?: string
  items: { hardwareId: string; note?: string }[]
}

// Response shapes
export type Page<T> = { items: T[]; nextCursor?: string }
export type BoardParams = {
  kind: BoardKind
  runtime?: string[]
  vendor?: string
  type?: HardwareType
  verification?: VerificationStatus
  q?: string
  limit?: number
  cursor?: string
}
export type BoardResponse = { board: BoardMeta; items: BoardRow[]; nextCursor?: string; chart: ChartBar[] }
export type HardwareParams = { type?: HardwareType; vendor?: string; q?: string; limit?: number; cursor?: string }
export type HardwareDetail = HardwareItem & { chart: ChartBar[]; rigs: RigSummary[]; results: Result[] }
export type RigsParams = { owner?: string; hardware?: string; sort?: 'newest' | 'results' | 'tps'; limit?: number; cursor?: string }
export type RigDetail = Rig & { results: Result[]; chart: ChartBar[] }
export type ResultsParams = {
  rig?: string
  hardware?: string
  model?: string
  quant?: string
  runtime?: string
  user?: string
  limit?: number
  cursor?: string
}
export type ResultRank = { kind: BoardKind; position: number; boardSize: number }
export type ResultDetail = Result & { rank?: ResultRank }
export type HomeResponse = {
  stats: { results: number; rigs: number; hardware: number; members: number }
  topRigs: RigSummary[]
}
/** One tile per model: the quant with the most results and that board's top three rigs. */
export type ModelSummary = { model: Model; board: BoardMeta; top: BoardRow[] }
/** Site-wide top results: best entry per rig-or-part, model, and quant, ranked by decode tok/s. */
export type TopResultsParams = { model?: string; quant?: string; limit?: number }
export type TopResultsResponse = { items: BoardRow[]; chart: ChartBar[]; total: number }

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}

export interface Api {
  readonly mode: 'mock' | 'live'
  // auth
  me(): Promise<User | null>
  signInUrl(returnTo: string): string
  /** Mock only: pick a seeded user. Live mode redirects to GitHub instead. */
  mockSignIn?(handle: string): Promise<User>
  /** Mock only: the seeded users offered by the sign-in dialog. */
  mockUsers?(): Promise<User[]>
  signOut(): Promise<void>
  // catalog
  models(): Promise<Model[]>
  model(id: string): Promise<Model>
  modelSummaries(): Promise<ModelSummary[]>
  runtimes(): Promise<Runtime[]>
  quants(): Promise<Quant[]>
  hardware(params?: HardwareParams): Promise<Page<HardwareItem>>
  hardwareItem(id: string): Promise<HardwareDetail>
  // boards
  board(modelId: string, quant: string, params: BoardParams): Promise<BoardResponse>
  // rigs
  rigs(params?: RigsParams): Promise<Page<RigSummary>>
  rig(id: string): Promise<RigDetail>
  createRig(input: RigInput): Promise<Rig>
  updateRig(id: string, input: Partial<RigInput>): Promise<Rig>
  deleteRig(id: string): Promise<void>
  // results
  results(params?: ResultsParams): Promise<Page<Result>>
  result(id: string): Promise<ResultDetail>
  createResult(input: ResultInput): Promise<Result>
  updateResult(id: string, input: Partial<ResultInput>): Promise<Result>
  deleteResult(id: string): Promise<void>
  confirmResult(id: string): Promise<Verification>
  flagResult(id: string, reason: FlagReason, note?: string): Promise<Moderation>
  // users
  user(handle: string): Promise<User>
  userRigs(handle: string): Promise<Page<RigSummary>>
  userResults(handle: string): Promise<Page<Result>>
  // home + uploads
  home(): Promise<HomeResponse>
  topResults(params?: TopResultsParams): Promise<TopResultsResponse>
  upload(file: File): Promise<{ url: string }>
}
