# API contract (draft for Jack)

Companion to [SPEC.md](SPEC.md). The front end talks to the network only through `src/lib/api.ts`, whose functions map one-to-one onto these endpoints. Anything not listed here is not needed for v1.

## Conventions

- JSON over HTTPS under `/api`. Dates are ISO 8601 strings. IDs are strings.
- Auth is a session cookie set by the GitHub OAuth callback. `GET /api/me` returns the current user or 401.
- List endpoints accept `limit` (default 25, max 100) and `cursor`, and return `{ items, nextCursor }`.
- Errors return `{ error: { code, message, fields? } }` with 400, 401, 403, 404, or 409.
- Hidden results are omitted everywhere except for their owner, who receives them with `moderation.hidden = true`.
- Ranking (best per hardware unit, highest decode tok/s, earliest run date on ties) is computed server-side.

## Auth

| Method | Path | Notes |
|---|---|---|
| GET | `/auth/github` | Redirects to GitHub with scope `read:user`. Accepts `?returnTo=` |
| GET | `/auth/github/callback` | Exchanges the code, upserts the user from the GitHub profile (login, name, avatar, bio), sets the session cookie, redirects to `returnTo` |
| POST | `/auth/logout` | Clears the session |
| GET | `/api/me` | Current `User` with `stats`, or 401 |

## Catalog

| Method | Path | Returns |
|---|---|---|
| GET | `/api/models` | `Model[]` with per-quant result counts |
| GET | `/api/models/:modelId` | `Model` |
| GET | `/api/models/summary` | `ModelSummary[]`: for each model, the quant with the most results as `board` and that board's top three rig rows as `top`. Route this before `/api/models/:modelId` |
| GET | `/api/runtimes` | `Runtime[]` |
| GET | `/api/quants` | `Quant[]` |
| GET | `/api/hardware?type=&vendor=&q=&limit=&cursor=` | `HardwareItem[]` with `resultsCount` and `rigsCount` |
| GET | `/api/hardware/:hardwareId` | `HardwareItem` plus `chart: ChartBar[]`, `rigs: RigSummary[]`, `results: Result[]` (component-level results naming this part, best first) |

Catalog data comes from the open catalog repo. The backend re-syncs on merge; the front end never writes catalog data.

## Boards

| Method | Path | Returns |
|---|---|---|
| GET | `/api/boards/:modelId/:quant?kind=rigs\|components&runtime=&vendor=&type=&verification=&q=&limit=&cursor=` | `{ board: BoardMeta, items: BoardRow[], nextCursor, chart: ChartBar[] }` |

`chart` is the top ten rows of the same filtered view, so the chart and the table always agree.

## Rigs

| Method | Path | Notes |
|---|---|---|
| GET | `/api/rigs?owner=&hardware=&sort=newest\|results\|tps&limit=&cursor=` | `RigSummary[]` |
| GET | `/api/rigs/:rigId` | `Rig` plus `results: Result[]`, `chart: ChartBar[]` |
| POST | `/api/rigs` | Body `RigInput`. Signed in |
| PATCH | `/api/rigs/:rigId` | Body partial `RigInput`. Owner only |
| DELETE | `/api/rigs/:rigId` | Owner only. Deletes the rig's results too |

## Results

| Method | Path | Notes |
|---|---|---|
| GET | `/api/results?rig=&hardware=&model=&quant=&runtime=&user=&limit=&cursor=` | `Result[]`, newest first |
| GET | `/api/results/:resultId` | `Result` plus `rank: { kind, position, boardSize }` |
| POST | `/api/results` | Body `ResultInput`. Signed in. Server validates that `componentId` belongs to `rigId` and that `quant` is in the model's quant list |
| PATCH | `/api/results/:resultId` | Owner only. Any change resets verification to `self_reported` and clears confirmations |
| DELETE | `/api/results/:resultId` | Owner only |
| POST | `/api/results/:resultId/confirm` | Toggle. Signed in, not the owner. Returns updated `verification` |
| POST | `/api/results/:resultId/flag` | Body `{ reason, note? }`. Toggle. Signed in, not the owner. Returns updated `moderation` |

Thresholds for `community_verified` and `hidden` are server configuration. Proposal: 3 and 3.

## Users

| Method | Path | Returns |
|---|---|---|
| GET | `/api/users/:handle` | `User` with `stats` |
| GET | `/api/users/:handle/rigs` | `RigSummary[]` |
| GET | `/api/users/:handle/results` | `Result[]` |

## Home and uploads

| Method | Path | Notes |
|---|---|---|
| GET | `/api/home` | `{ stats, topRigs: RigSummary[] }` |
| GET | `/api/results/top?model=&quant=&limit=` | `{ items: BoardRow[], chart: ChartBar[], total }`. Site-wide ranking: best entry per rig-or-part, model, and quant by decode tok/s, hidden entries excluded. Route this before `/api/results/:resultId` |
| POST | `/api/uploads` | Multipart image, max 5 MB, returns `{ url }`. Signed in. Used for rig photos |

## OG images

Served by a Vercel edge function in the front-end deploy, not by this API. It reads the public endpoints above. Nothing for Jack to build.

## Types

```ts
export type Quant = { id: string; label: string; bits: number; format: string };

export type Model = {
  id: string; name: string; family: string; params: string;
  architecture: "dense" | "moe"; activeParams?: string; sourceUrl: string;
  logoUrl?: string; brandColor?: string; // logo is a catalog asset; brandColor drives the monogram fallback
  quants: string[]; resultCounts?: Record<string, number>;
};

export type Runtime = { id: string; name: string; logoUrl: string; repoUrl: string; color: string };

export type HardwareType = "cpu" | "gpu" | "igpu" | "npu" | "ram";

// `color` is the runtime's categorical chart color, set in the catalog.
export type HardwareItem = {
  id: string; type: HardwareType; vendor: string; name: string; series?: string;
  specs: Record<string, string | number>; releaseDate?: string; imageUrl?: string;
  source: "seeded" | "community"; resultsCount?: number; rigsCount?: number;
};

export type User = {
  id: string; handle: string; name?: string; avatarUrl: string; bio?: string;
  createdAt: string; tier?: null;
  stats?: { results: number; rigs: number;
            bestRank?: { modelId: string; quant: string; kind: "rigs" | "components"; position: number };
            confirmationsGiven: number };
};

export type RigComponent = { hardwareId: string; quantity: number; hardware?: HardwareItem };

export type Rig = {
  id: string; ownerId: string; owner?: User; name: string; os: string;
  photoUrl?: string; notes?: string; components: RigComponent[];
  summary: string; createdAt: string; updatedAt: string;
};
export type RigSummary = Pick<Rig, "id" | "name" | "photoUrl" | "summary" | "owner"> &
  { resultsCount: number; bestTps?: number };
export type RigInput = Pick<Rig, "name" | "os" | "photoUrl" | "notes"> & { components: { hardwareId: string; quantity: number }[] };

export type Verification = { status: "self_reported" | "community_verified"; confirmations: number; confirmedByMe?: boolean };
export type Moderation = { flags: number; hidden: boolean; flaggedByMe?: boolean; reasons?: FlagReason[] };
export type FlagReason = "implausible" | "wrong_hardware" | "duplicate" | "spam" | "other";

export type Result = {
  id: string; submitterId: string; submitter?: User;
  modelId: string; quant: string; runtimeId: string; runtimeVersion: string;
  rigId: string; rig?: RigSummary; componentId?: string; componentQuantity?: number; component?: HardwareItem;
  decodeTps: number; promptTps?: number; ttftMs?: number; contextLength?: number; batchSize?: number;
  notes?: string; repoUrl: string; runDate: string;
  verification: Verification; moderation: Moderation; createdAt: string; updatedAt: string;
};
export type ResultInput = Omit<Result, "id" | "submitterId" | "submitter" | "rig" | "component" | "verification" | "moderation" | "createdAt" | "updatedAt">;

export type BoardMeta = { modelId: string; quant: string; kind: "rigs" | "components"; total: number };
export type BoardRow = {
  rank: number; result: Result;
  unit: { kind: "rig"; rig: RigSummary } | { kind: "component"; hardware: HardwareItem; quantity: number };
};
export type ChartBar = { label: string; tps: number; runtimeId: string; href: string };
export type TopResultsResponse = { items: BoardRow[]; chart: ChartBar[]; total: number };
export type ModelSummary = { model: Model; board: BoardMeta; top: BoardRow[] };

```
