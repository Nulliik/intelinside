# Product Spec — working name "intelinside"

**Status:** decisions locked Sep 2, 2026 (Horace, with Claude). Front end only.
**Owners:** Horace Choi (design + front end), Jack Smith (backend + functionality), Tate Berenbaum (review).
**Target:** coded front end on mock data, plus the API contract in [API.md](API.md), by Friday Sep 4, 2026.

---

## 1. What this is

A public, community-driven leaderboard of AI inference performance on real hardware. People sign in with GitHub, register their rigs, and submit the decode tokens-per-second they achieved for a model at a given quantization on a given runtime. A rig decomposes into components, so a result can describe the whole rig or a single part inside it. Every result carries a required runtime, shown with a logo that links to that runtime's repo.

Think PC Part Picker meets a local-AI benchmark table: the hardware database is open source and grows by pull request.

It is a separate product from Cascadia and Trials, with only a "powered by Cascadia" footnote.

### What it is not

- **Not Trials.** No links, no imported records. Trials stays a separate product.
- **Not a verified benchmark.** Results are self-reported. The community confirms or flags them.
- **No accuracy gate and no cost metric in v1.** Both were explicitly deferred by Tate on Sep 2.

### Who it is for

Primary: local AI enthusiasts running models on NUCs, Arc cards, and gaming PCs. The r/LocalLLaMA crowd. Tone is "show your rig."

Secondary: developers comparing runtimes on given hardware, and Intel or partner buyers validating what the silicon can do. Both are served by the same pages; only the home page copy leads with the enthusiast.

---

## 2. Decisions log (locked Sep 2, 2026)

| Area | Decision |
|---|---|
| Friday deliverable | Coded front end running on mock data, plus a typed API contract Jack implements |
| Stack | Vite, React 19, Tailwind 4, react-router (same base as Trials; Tailwind moved from 3.4 to 4 because current shadcn requires it). Components are stock shadcn/ui, base-nova preset on Base UI primitives, dark mode only. No visual association with Trials |
| v1 scope | Model leaderboards, hardware pages (components and rigs), profiles, submit flow, charts. Collections were in this list until Sep 2, see below |
| Sign-in | GitHub OAuth. Public read; sign in to write (rigs, results, confirm, flag) |
| Submissions | Manual form with a link to the repo you ran in. Where results are stored is Jack's call. A "submit via PR" autofill path stays optional pending the backend decision. Catalog additions (hardware, models, runtimes) are PRs to the open catalog repo |
| Moderation | Community flag threshold. Past the threshold an entry is hidden pending review |
| Editing | Users edit and delete their own rigs and results. Resubmitting the same rig, model, quant, and runtime adds a new dated entry; the best one ranks |
| Headline metric | Decode tok/s. Prompt-processing tok/s and time to first token are optional fields |
| Model key | Model plus quantization. Each pair is its own board |
| Vendors | Any vendor accepted. Intel seeded; others arrive by PR |
| Component types | CPU, GPU (discrete), iGPU, NPU, RAM |
| Rig fields | Name, OS, optional photo, optional notes, components with quantity |
| Ranking | Best entry per hardware unit. Highest decode tok/s; earliest run date wins ties |
| Verification states | Self-reported, community-verified. No Trials-verified state |
| Trials | Separate product. No link, no import |
| Result fields | Required: model, quant, runtime and version, rig or component, decode tok/s, repo link, run date. Optional: prompt tok/s, time to first token, context length, batch size, notes |
| Audience | Local AI enthusiasts lead the home page |
| Browse pages | Model pages and hardware pages (per component and per rig) |
| Profile | Rigs, results, GitHub avatar and bio, plus a stats header. Tier slot reserved |
| Collections | Cut from v1 on Sep 2. Rig pages already carry the parts list, photo, and notes, and the affiliate links that made the kit.co idea work were already deferred. Returns as one feature, curated lists with buy links, when there is demand |
| Charts | Model page: tok/s by hardware bars. Component and rig pages: tok/s by model bars |
| Seed models | Qwen3-8B, Qwen3-30B-A3B, Llama 3.1 8B, Gemma 3 12B |
| Seed runtimes | Cascadia, PyTorch, vLLM, llama.cpp, Ollama, OpenVINO GenAI, IPEX-LLM |
| Brand | shadcn zinc dark theme, one accent color, placeholder text wordmark until the name lands |
| Responsive and sharing | Desktop-first, usable on a phone. OG images for rig, result, and model pages |
| Accessibility (Sep 2) | WCAG 2.2 AA: text 4.5:1 (large 3:1), focus indicators 3:1, every row action reachable by keyboard, skip link and landmarks. Palette moved to a muted OKLCH-derived set. One accepted deviation: control borders stay at the 12% hairline |
| Logo colours (Sep 2) | Every mark keeps its original brand colours; marks drawn black in the original render white on the dark ground |
| Launch week (Sep 3) | The home page runs a sealed state behind `VITE_REVEAL_AT` until the board goes live, Fri Sep 11, 9:00 AM PT. See §8, Home |

---

## 3. Open items

| # | Item | Owner | Notes |
|---|---|---|---|
| 1 | Product name and domain | Horace | "Intel Inside" has trademark risk. One word, no dashes. Wordmark is a config constant so the rename is one line |
| 2 | Where results are stored | Jack | Front end is agnostic behind `src/lib/api.ts`. Decide database vs repo-ingest before wiring |
| 3 | Confirm threshold and flag threshold | Jack + Tate | Proposal: 3 confirmations to community-verify, 3 flags to hide. Backend config; front end only reads status |
| 4 | Accent color | Done | #5438FF, set once as `--primary` in `globals.css` |
| 5 | Photo uploads | Jack | Rig photos need storage. Contract assumes `POST /api/uploads` |
| 6 | OG images and crawler meta tags | Horace | Vite SPA cannot serve per-page meta. Plan: Vercel edge function that serves an HTML shell with OG tags to crawlers and generates PNGs from the public API. Data is public, so no auth needed |
| 7 | Catalog repo | Jack + Horace | Name, JSON schema, and how the backend ingests merged PRs. Catalog covers hardware, models, quants, runtimes |
| 8 | Quant vocabulary | Team | Controlled list below. Decide whether 4-bit formats (OpenVINO INT4, GGUF Q4_K_M, AWQ) ever share a board. Current decision: no, each tag is its own board. Revisit if boards get thin |
| 9 | Accuracy field | Deferred | Tate: "eventually we're going to have to figure out an accuracy thing." Out of v1 |
| 10 | Cost metric | Deferred | Tate: "we wouldn't have to worry about the cost thing, at least not yet" |

---

## 4. Core objects

### User
GitHub identity. Fields: `id`, `handle`, `name`, `avatarUrl`, `bio` (pulled from GitHub at sign-in), `createdAt`. Computed stats: results count, rigs count, best rank currently held, confirmations given. `tier` is reserved and null in v1.

### Hardware item (catalog)
One entry in the open hardware database. Fields: `id` (slug such as `intel-arc-pro-b70`), `type` (`cpu` | `gpu` | `igpu` | `npu` | `ram`), `vendor`, `name`, `series`, type-specific `specs`, optional `releaseDate`, optional `imageUrl`, `source` (`seeded` | `community`).

RAM is modeled as a module spec (type, speed, capacity per module); the rig's quantity gives total capacity.

### Rig
A user's machine. Fields: `id`, `ownerId`, `name`, `os`, optional `photoUrl`, optional `notes`, `components: [{ hardwareId, quantity }]`, timestamps. A derived one-line summary is shown everywhere the rig appears, for example "Core Ultra 9 285K · 4× Arc Pro B70 · 128 GB DDR5".

### Model (catalog)
Fields: `id` (slug such as `qwen3-8b`), `name`, `family`, `params`, `architecture` (`dense` | `moe`), optional `activeParams`, `sourceUrl`, `quants` (the quant tags that have boards for this model).

### Quant (controlled vocabulary)
A tag with a `bits` attribute and a `format` label. Starting list: `int4`, `int8`, `fp8`, `fp16`, `bf16`, `q4_k_m`, `q4_0`, `q5_k_m`, `q6_k`, `q8_0`, `awq-4bit`, `gptq-4bit`, `nf4`, `mxfp4`. Extended by PR to the catalog.

### Board
The pair (model, quant). Each board has two leaderboards: **rigs** and **components**.

### Runtime (catalog)
Fields: `id`, `name`, `logoUrl`, `repoUrl`. Seed: Cascadia, PyTorch, vLLM, llama.cpp, Ollama, OpenVINO GenAI, IPEX-LLM.

### Result
One benchmark submission. Required: `submitterId`, `modelId`, `quant`, `runtimeId`, `runtimeVersion`, `rigId`, `decodeTps`, `repoUrl`, `runDate`. Component-level results also set `componentId` (must be a component of the rig) and `componentQuantity` (how many of that part were used, default 1). Optional: `promptTps`, `ttftMs`, `contextLength`, `batchSize`, `notes`.

Server-maintained: `verification` (`self_reported` | `community_verified`, plus `confirmations`), `moderation` (`flags`, `hidden`), timestamps.

### Confirmation and Flag
One per user per result, toggleable. A user cannot confirm or flag their own result. Flag reasons: `implausible`, `wrong_hardware`, `duplicate`, `spam`, `other`, with an optional note.

---

## 5. Leaderboard rules

1. A board is (model, quant). It has a **rigs** leaderboard and a **components** leaderboard.
2. Eligible results are those not hidden by moderation.
3. **Rigs leaderboard.** Results with no `componentId`. Group by `rigId`. Each rig appears once at its highest `decodeTps`. Rank descending. Ties go to the earliest `runDate`.
4. **Components leaderboard.** Results with a `componentId`. Group by (`hardwareId`, `componentQuantity`) so "1× Arc Pro B70" and "2× Arc Pro B70" are separate rows. Each group appears once at its highest `decodeTps`. Same ordering and tie rule.
5. Runtime is a column, not a board dimension. Boards mix runtimes. Filtering by runtime recomputes best-per-unit within the filter.
6. Filters available on every board: runtime, vendor, component type (components board only), verification state.
7. Row contents: rank, hardware (rig name and summary, or component name with quantity), runtime logo linking to the runtime repo, runtime version, decode tok/s, optional prompt tok/s and TTFT, submitter avatar and handle, verification badge, run date, link to the result page.
8. Ranking is computed server-side so pagination stays correct. The mock layer implements the same rule client-side.

---

## 6. Verification and moderation

- Every new result is **self-reported**.
- Signed-in users who did not submit the result can **Confirm** it ("I reproduced this or checked the linked repo"). At the confirm threshold the result becomes **community-verified** and gets the badge. Confirmations are toggles; withdrawing one below the threshold reverts the state.
- Signed-in users can **Flag** a result with a reason. At the flag threshold the result is **hidden pending review**: removed from boards, charts, feeds, and profiles for everyone except the owner, who sees it with a "hidden pending review" badge and the reasons. The team resolves hidden entries outside the front end in v1.
- Thresholds are backend configuration. The front end only renders `verification.status`, `confirmations`, `moderation.hidden`, and whether the current user has confirmed or flagged.
- Owners can edit or delete their results. Editing a community-verified result resets it to self-reported and clears confirmations, and the UI warns before saving.

---

## 7. Page map

| Route | Page | Auth |
|---|---|---|
| `/` | Home | public |
| `/models` | Model index | public |
| `/models/:modelId` | Model page (redirects to default quant) | public |
| `/models/:modelId/:quant` | Board: rigs and components leaderboards, chart, filters | public |
| `/hardware` | Hardware database browse and search | public |
| `/hardware/:hardwareId` | Component page | public |
| `/rigs` | Rig gallery | public |
| `/rigs/:rigId` | Rig page | public |
| `/rigs/new`, `/rigs/:rigId/edit` | Rig editor | signed in |
| `/results/:resultId` | Result detail | public |
| `/submit` | Result submission form | signed in |
| `/results/:resultId/edit` | Result editor | owner |
| `/u/:handle` | Profile | public |
| `/guidelines` | How to submit, what counts, what gets flagged | public |
| `/about` | What this is, catalog repo links, "powered by Cascadia" | public |
| `/auth/callback` | OAuth return | — |

**Navigation.** Top bar: wordmark, Models, Hardware, Rigs, a "Submit result" accent button, and either "Sign in with GitHub" or the avatar menu (profile, my rigs, my results, sign out). Footer: about, guidelines, catalog repo on GitHub, and "Powered by" followed by the Cascadia lockup (ring and wordmark, from the brand assets) linking to cascadia.to. (Sep 2: replaced the plain "powered by Cascadia" text; Sep 3: the link moved from the repo to the site.)

**Signed-out write attempts** open a sign-in dialog that explains what sign-in unlocks and that only `read:user` scope is requested. After sign-in the user returns to where they were.

---

## 8. Page specs

### Home `/`
1. **Hero.** Headline for enthusiasts, one-line subhead, two CTAs: "Sign in with GitHub" (accent) and "Browse leaderboards".
2. **Stat strip.** Results, rigs, hardware items, members, as four cells.
3. **Top results.** A pill filter (All models, or one model), a podium of the top three as cells, first to third left to right, each led by the submitter's avatar and name, then the figure at one size across all three, then labelled Hardware, Model, and Runtime fields. Ranks are gold, silver, and bronze medal tiles with an accessible "First place" label, and the top ten as a ranked table with a Model column beneath it. (Sep 2: the podium replaced a bar chart of the top ten.) Ranking is site-wide: the best entry per rig-or-part, model, and quant by decode tok/s, so with "All models" selected the list mixes boards and each row says which. (Sep 2: replaced the newest-first "Latest results" table, which was the strongest element on the page but the least useful order.)
4. **Top rigs.** Six rig cells with image, name, summary, owner, best result.
5. Footer. (Sep 2: the Boards tiles moved to the Models page.)

**Launch week (Sep 3, Horace with Claude).** The site launches Mon Sep 7 with no results, so until the board goes live the home page runs a sealed state behind `VITE_REVEAL_AT`, an ISO instant (`2026-09-11T16:00:00Z`, Fri Sep 11, 9:00 AM PT). Unset or past means the ordinary page, so the code goes inert on its own. Submissions are open all week and rank the moment the board goes live; from then on it is an ordinary live board. The vocabulary is "sealed" before and "goes live" for the moment, never "first board", which would imply a second. The page: the hero with its second button pointed at the hardware catalog; a silhouette of the podium and table with a message and submit button in a clearing on it, no data underneath and nothing blurred; a four-cell countdown to the instant, shown in the viewer's zone; a silhouette of six rig cells with a register button, giving way to Newest rigs (tok/s hidden) once six rigs exist; and one row from the catalog with counts hidden. The stat strip sits out the week. The rule: nothing on the launch-week page shows a number that depends on participation. The rig silhouette is also the ordinary page's empty state for zero rigs. The same seal covers every ranked view: the board page shows a chart-shaped silhouette with the message in place of its filters, chart, and table; model index tiles hide result counts and show a silhouette with a submit link in place of the top three, with a submit button in the page header; the hardware browse hides result and rig counts; and the component page shows the silhouette in place of its chart and results table, with rig cards' results hidden; the rig page shows the silhouette in place of its chart and results table; the rig gallery sorts newest-first only, hides tok/s and result counts, and uses the rig silhouette as its empty state. The catalog, profiles, and result pages stay live. Demo: the `frontend-sealed` launch config runs the dev server with `--mode sealed` (sealed, with the seed's rigs), and `frontend-launch` runs `--mode launch` (sealed with no rigs or results, as on launch morning); each loads its `frontend/.env.<mode>` file. `VITE_MOCK_EMPTY=true` is what empties the mock.

### Model index `/models`
Grid of model tiles, one per model: mark, family, params, result count, name, a chip per quant with its count under a "Quantization" caption (the busiest quant highlighted, each chip with the same plain-words tooltip as the board page), that quant's top three rig rows with runtime mark and tok/s, and a "Full board" link. Search box. (Sep 2: absorbed the board tiles that used to sit on the home page.)

### Board `/models/:modelId/:quant`
- Header: model name, source link, architecture and params, and a quant selector under a "Quantization" caption: one pill per quant with its result count and a tooltip that explains the format in plain words, for example "4-bit · GGUF, used by llama.cpp and Ollama · 19 results". Descriptions come from the quant catalog.
- Tabs: **Rigs** and **Components**.
- Filter bar: runtime (multi), vendor, component type (components tab), verification state, search.
- Chart: horizontal bars, top ten rows of the active tab, bar color by runtime, value label in tok/s. Hidden on phone below a toggle.
- Leaderboard table per section 5. Sticky header, 25 rows per page, cursor pagination.
- Empty state: "No results yet for {model} {quant} on {tab}. Be the first." with a Submit CTA.
- Row click opens the result page. Hardware and submitter are links.

### Hardware browse `/hardware`
Table or card toggle. Filters: type, vendor, search. Each item: name, vendor, type, key spec, results count, rigs count. A persistent "Missing something? Add it by PR" link to the catalog repo with the contribution guide.

### Component page `/hardware/:hardwareId`
- Header: name, vendor, type, spec sheet, release date, source badge (seeded or community).
- Chart: horizontal bars of best decode tok/s per (model, quant), colored by runtime.
- Results table: every visible result that names this component, with quantity, model, quant, runtime, tok/s, submitter, verification, date. Filters: model, runtime, quantity.
- Rigs containing this component: card row.

### Rig gallery `/rigs`
Card grid in the PC Part Picker completed-builds spirit: photo (placeholder pattern when none), name, summary line, owner, best result chip, results count. Sort: newest, most results, top tok/s. Filter by component.

### Rig page `/rigs/:rigId`
- Header: photo, name, OS, owner, notes, edit and delete for the owner.
- Components list with quantity, each linking to the component page.
- Chart: best decode tok/s per (model, quant) on this rig, colored by runtime, including component-level results labeled with the part.
- Results table: every visible result for this rig. Owner also sees hidden ones with status.
- "Submit a result for this rig" CTA for the owner.

### Rig editor `/rigs/new`, `/rigs/:rigId/edit`
Single page. Name, OS (free text with suggestions), photo upload, notes. Component picker: search the catalog by name with type and vendor filters, add with quantity, reorder. Live summary line preview. Validation: at least one component, name required. Cannot delete a rig that has results without confirming that its results will be deleted too.

### Submit `/submit`
Single scrolling form with a live preview card on the right (stacked on phone).
1. **Rig.** Pick one of my rigs. If none, an inline "create a rig first" panel opens the rig editor fields.
2. **Target.** Whole rig, or one component from that rig with quantity used (default 1).
3. **Model and quant.** Model select, then quant select limited to that model's quants.
4. **Runtime.** Select with logos, then version as free text.
5. **Numbers.** Decode tok/s (required, > 0). Optional prompt tok/s, time to first token in ms, context length, batch size.
6. **Evidence.** Repo link (required, must be a URL). Run date (required, not in the future). Notes.
7. Submit. Success state shows the new rank on the relevant board and share actions.
Validation is inline. The preview card is the same component used on result pages.

### Result page `/results/:resultId`
Card: model and quant, hardware (rig or component with quantity), runtime logo and version, decode tok/s large, optional metrics, submitter, run date, repo link, notes, verification badge with confirmation count, and rank on its board. Actions: Confirm, Flag (with reason dialog), Share (copies URL; OG image makes it unfurl), and Edit or Delete for the owner. Hidden results show the hidden status to the owner only; others get a 404.

### Profile `/u/:handle`
- Header: avatar, name, handle linking to GitHub, bio, member since.
- Stats header: results, rigs, best rank held (for example "#1 · Qwen3-8B int4 · components"), confirmations given. Reserved space for a tier badge, unused in v1.
- Tabs: Rigs, Results. Each reuses the cards and tables above. The owner sees hidden results with status.

### Guidelines `/guidelines`
What to submit, how to measure decode tok/s, what the optional fields mean, what gets confirmed, what gets flagged, and how to add hardware or a model by PR.

### About `/about`
What the product is, who runs it, the catalog repo, and the "powered by Cascadia" footnote.

---

## 9. User flows

1. **Sign in.** Click "Sign in with GitHub" → GitHub OAuth (`read:user`) → `/auth/callback` → session cookie → return to origin page. First sign-in creates the user with GitHub avatar and bio.
2. **Create a rig.** Signed in → `/rigs/new` → fill fields, pick components with quantities → save → rig page.
3. **Submit a result.** Signed in → `/submit` → pick rig and target → model, quant, runtime → numbers → repo link and date → submit → result page with rank and share.
4. **Confirm or flag.** On any result not your own → Confirm toggles; Flag opens a reason dialog. Status badges update immediately.
5. **Edit or delete.** Owner opens edit from the rig or result page. Delete asks for confirmation and explains side effects (deleting a rig deletes its results).
6. **Add hardware or a model.** Any page → "Missing something?" → catalog repo contribution guide → PR. Merged PRs appear on the site after the backend re-syncs the catalog.

---

## 10. Charts

Built with shadcn chart components on Recharts. Dark theme tokens, runtime color scale shared across the app and used in the legend.

- **Board chart.** Horizontal bars, top ten rows of the active tab, x axis decode tok/s, bar color by runtime, value labels. Responds to filters.
- **Hardware chart.** On component and rig pages: horizontal bars, one per (model, quant) at its best tok/s, colored by runtime.
- Both charts hide below a toggle on narrow screens and render as a plain list if fewer than two rows exist.

Scatter against release date and record trajectories are v2.

---

## 11. Design system and brand placeholder

- **Components:** stock shadcn/ui (base-nova preset on Base UI primitives) and Tailwind 4, dark mode only (`class="dark"` on the root). No Trials components or reveal animations.
- **Layout language (added Sep 2, after Horace shared Tailark blocks):** a framed, hairline grid. Two vertical guide lines run the full page height at the container edges; sections draw horizontal rules between them, with an optional uppercase section label row. Lists are grid cells separated by 1px lines rather than floating cards, and images sit rounded inside their cell. Where a rule meets a guide, a small crosshair registration mark sits on the intersection, on every section of every page and on the footer rule; there are no ruler strips or square markers. Filter tabs are bordered pills with the accent on the active one. Built from our own primitives in `frontend/src/components/frame.tsx`; nothing is taken from Tailark.
- **Palette:** #0A0A0A ground, hairlines at 8% white (decorative), control borders at 12% white by choice, zinc-400 body text, white headings. The accent #5438FF is used only as a fill with white text (6.2:1). Active pills are white text on a 40% foreground border; the tint `--primary-text` #9c9cff (8:1) exists for any future accent-coloured text. Focus ring `--ring` #d4d4d8, light grey. Status: verified #6dc799, warning #edbb64. Runtime scale, muted and derived in OKLCH at L≈0.75, C≈0.11: Cascadia #e89960, PyTorch #df8db5, vLLM #dac46d, llama.cpp #9ec773, Ollama #b4b7bf, OpenVINO GenAI #6ab8e4, IPEX-LLM #64c6ad. Every colour above measures at least 8:1 on the ground.
- **Type:** Red Hat Display for headings, Red Hat Text for UI, Red Hat Mono for numbers and version strings (Horace, Sep 2). Sits away from Trials' Geist.
- **Type scale (Sep 2, after comparing PatternFly, Radix Themes, Material 3, Apple HIG, and Red Hat's brand standards):** sizes and roles follow PatternFly because it was built for these faces; line-heights follow the Radix ladder and stay inside Red Hat's 1.1 to 1.5 rule; tracking is left at the font's own except uppercase micro labels, which get 0.06em. Tokens live in `globals.css`.

| Role | Face | Size / line | Weight | Used for |
|---|---|---|---|---|
| Display | Red Hat Display | 60 / 66, 36 / 44 on phones | 600 | Home hero |
| Page title | Red Hat Display | 36 / 44, 28 / 36 on phones | 600 | Page headers |
| Section title | Red Hat Display | 20 / 28 | 600 | Reserved for in-page titles |
| Cell title | Red Hat Display | 18 / 26 | 600 | Rig, hardware, and model cells |
| Reading copy | Red Hat Text | 16 / 24 | 400 | Page descriptions, guidelines, about |
| Lede | Red Hat Text | 18 / 26 | 400 | Home hero paragraph |
| UI text | Red Hat Text | 14 / 20 | 400, 500 for emphasis | Tables, cells, buttons, inputs, meta |
| Helper | Red Hat Text | 12 / 16 | 400 | Dates, captions, summaries under titles |
| Label | Red Hat Text | 12 / 16, uppercase, 0.06em | 500 | Section labels, table headers, eyebrows on numbers |
| Number | Red Hat Mono | 16 / 20 in tables, 28 / 36 stats, 60 / 66 hero figure | 500, 600 | Decode tok/s, counts, versions, quant tags |

- **Icons:** lucide.
- **Wordmark:** the lockup at `frontend/public/logos/intelinside-lockup.svg` (mark in #7052FF with white bars, white wordmark) in the nav and the phone menu, from Horace on Sep 3; the favicon is Horace's PNG of the mark at `frontend/public/favicon.png`. `BRAND_NAME` still supplies the page title and the alt text.
- **Logos:** every mark keeps its original brand colours (Sep 2: replaced tinting runtime marks in their chart colour and vendor marks in the muted text colour). Marks drawn black in the original (Apple, Ollama, llama.cpp, the OpenVINO ring) render in the foreground white so they read on the dark ground. Runtime marks sit beside the runtime name: Cascadia's own ring from the brand assets, PyTorch, vLLM, and Ollama from the Simple Icons set (CC0), llama.cpp's mark from the llama.cpp project (MIT), the first "O" of the OpenVINO wordmark with its purple accent for OpenVINO GenAI, and a two-letter tile for IPEX-LLM until the catalog carries a mark for it. Marks are generated by `frontend/scripts/generate-marks.mjs` (`npm run marks`), which stores each path with its own fill. Hardware vendor marks (Intel, NVIDIA, AMD, Apple) come from the Simple Icons set, released under CC0, inlined as SVG with tight bounding boxes so every mark shares one height and keeps its own width; vendors without a mark show their name. Model marks (Qwen, Meta for Llama, Gemma) come from the LobeHub icon set, an MIT-licensed package; the marks themselves are their owners' trademarks, used only to identify the models. Files live in `frontend/public/logos/models/`, referenced by `logoUrl` in the catalog.
- **Density:** tables are the product. Compact rows, sticky headers, monospace numerals, right-aligned metrics.

---

## 12. Responsive and sharing

- Desktop-first at 1280 and up. Tables scroll horizontally inside their container on narrow screens, never the page. The submit form stacks its preview under the fields on phones.
- Every rig, result, and model board page has an OG image and title and description meta tags. Because this is a Vite SPA, crawlers are served an HTML shell with the correct tags by a Vercel edge function, and the same function renders PNGs from the public API. Humans get the SPA.

### Accessibility

Target is WCAG 2.2 AA, checked in the browser with a script that walks every rendered text node and measures it against its effective background.

- **Text** 4.5:1, large text 3:1. The only failure found on Sep 2 was accent text on the ground in the active pill, fixed by switching that text to white.
- **Non-text** 3:1 for focus indicators (`--ring` #d4d4d8, light grey; components' 50% ring still clears 3:1 at 3.9:1) and for the active pill's border (foreground at 40%, 3.8:1). Known deviation, Horace's call on Sep 2: input, select, toggle, and outline-button borders stay at the 12% hairline (1.3:1) for the look; those controls are identified by their fill, placeholder text, and icons instead. Grid hairlines are decorative and stay at 8%.
- **Keyboard.** Clickable table rows also carry a real link on the decode figure, podium cells are focusable and activate on Enter or Space, and a "Skip to content" link precedes the nav.
- **Structure.** Primary and mobile navs are labelled landmarks, `main` is the target of the skip link, tables use real header cells, charts are named figures whose data is repeated in the table beneath them, logos and placeholder images are decorative or labelled.
- **Colour is never the only signal.** Runtime dots sit beside the runtime name, verification badges carry text, chart bars are mirrored by the table.

---

## 13. Front-end architecture and mock data

- `src/lib/api.ts` is the only module that talks to the network. It exposes typed functions matching [API.md](API.md). `VITE_API_MODE=mock|live` switches between an in-memory mock and Jack's server.
- `src/mocks/` holds seed JSON: 4 models with their quants, 7 runtimes, about 40 Intel catalog items plus a handful of NVIDIA and AMD parts so mixed rigs look real, 10 users, 15 rigs with photos, roughly 120 results across boards. The mock implements ranking, confirm and flag thresholds, hidden state, and an in-memory session so every flow is clickable without a backend.
- Routing with react-router data loaders; skeleton states while loading; toast on errors.
- Auth state comes from `GET /api/me`. Write actions are hidden or replaced with the sign-in dialog when signed out.
- The app lives in `frontend/`. In mock mode the chosen mock user is remembered in localStorage so reloads keep you signed in; all other mock data resets on reload.

---

## 14. v1 scope and v2 backlog

**v1 (Friday Sep 4):** everything in sections 5 through 13.

**v2 backlog, in rough priority:**
1. Account levels or status tiers (slot already reserved on the profile).
2. Collections: curated hardware lists with affiliate or buy links, cut from v1 on Sep 2.
3. Admin moderation UI for hidden entries.
4. Runtime pages (`/runtimes/:id`) with results per runtime.
5. Scatter chart against hardware release date; record trajectory per board.
6. Accuracy field and, later, a gate.
7. Cost or price fields and tok/s per dollar.
8. CLI submission with API keys, as Localmaxxing does.
9. Hugging Face as a second sign-in.
10. Embeddable badges for READMEs ("my rig does 42 tok/s on Qwen3-8B int4").
11. Seed non-Intel catalog items broadly ahead of Cascadia going multi-vendor in Q1 2027.

The internal-only live deployment map is a separate internal tool and is not part of this product.

---

## 15. Timeline

| Date | Milestone |
|---|---|
| Wed Sep 2 | Spec and API contract locked (this document) |
| Thu Sep 3 | Front end scaffold, design tokens, mock data, boards and hardware pages |
| Fri Sep 4 | Submit flow, rigs, profiles, charts. Review with Tate and Jack |
| After | Jack wires the API behind `api.ts`; name and accent land; OG edge function |

---

## 16. References

- Sep 2, 2026 meeting notes and transcript (Tate, Jack, Horace).
- local.ai: entries are tested combinations of model, hardware, engine, quantization, harness, and config, with data by Exo Labs. https://local.ai/about
- Localmaxxing: every run is a row keyed by model, quant, hardware, and engine, with filters on each. https://www.localmaxxing.com/en
- LocalScore: fixed quant per model tier; model pages and accelerator pages mirror each other. https://www.localscore.ai/blog
- PC Part Picker completed builds, for the rig gallery. kit.co, for the collections idea now in the backlog.
