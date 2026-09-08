# Supabase environments

The project uses two independent hosted Supabase projects in the `CLabs`
organization. No local Supabase stack is required.

| Environment | Project | Project ref | Region |
| --- | --- | --- | --- |
| Staging | `intelinside` | `ujlacyedspjfekotemmd` | `us-east-1` |
| Production | `intelinside-prod` | `xnzhdnudmgquuwdpuisy` | `us-east-1` |

## Frontend selection

- `npm run dev` uses `frontend/.env`, which points to staging.
- `npm run build:staging` produces a staging build.
- `npm run build` uses `frontend/.env.production.local` when it is present.
- Hosted deployments should set `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY` in the deployment platform rather than rely
  on ignored local files.

Only the publishable key belongs in a Vite environment variable. Never put a
Supabase secret or legacy service-role key in a `VITE_*` variable.

Set `VITE_API_MODE=supabase` to read and write the shared hosted database. The
mock adapter remains available for offline development but is not used by the
staging configuration.

Rig writes call the authenticated `create_rig` and `update_rig` database
functions so the rig and its component rows are changed atomically. Result
writes use the Supabase table API directly. RLS enforces ownership for both.
Text length and profanity checks currently run in the browser and are therefore
user-experience checks, not a server-enforced security boundary.

A fresh clone needs a `frontend/.env` based on `.env.example`, populated with
the staging URL and browser-safe publishable key. The shared staging database
currently stores profiles, rigs, rig components, results, confirmations, and
flags. Models, quantizations, runtimes, and hardware are seeded by migrations.

## Database changes

Run commands from `frontend/`:

```sh
npm run supabase:db:push:staging
npm run supabase:db:push:prod:dry-run
```

Production deployment should remain a reviewed CI/release action. There is no
direct production reset command in this repository.

## Reset staging

The reset command contains a fixed staging project ref, verifies that it differs
from production, requires an explicit confirmation phrase, and disables seeds:

```sh
npm run supabase:db:reset:staging -- RESET-STAGING
```

This resets user-created database objects and reapplies migrations. Auth users
and stored files are separate managed services; if a complete environment wipe
is required, delete and recreate only the staging project instead.

## GitHub OAuth

One GitHub OAuth app can serve both environments by registering both Supabase
callback URLs. Separate OAuth apps are optional if stricter credential isolation
is preferred:

- Staging: `https://ujlacyedspjfekotemmd.supabase.co/auth/v1/callback`
- Production: `https://xnzhdnudmgquuwdpuisy.supabase.co/auth/v1/callback`

The GitHub client secrets must be stored in Supabase Auth configuration, never
in the React application or repository. Site URLs and allowed redirect URLs
must be configured after the staging and production frontend URLs are known.

For local staging tests, register the staging callback URL above in the GitHub
OAuth app, then enable GitHub in the staging project's Auth provider settings.
The frontend sends users back to `http://localhost:5173/auth/callback` (or the
equivalent `127.0.0.1` URL) and restores the page they originally requested.
Vite is pinned to port 5173 so it fails clearly instead of silently choosing a
port that Supabase has not allow-listed.

## Results submitted through PRs

Apply `20260908120000_ingest_pr_results.sql` to the target database before enabling
`.github/workflows/validate-results.yml`. Configure these GitHub Actions settings:

- Repository variable `SUPABASE_URL`: the target project's URL (production for the public repo).
- Repository secret `SUPABASE_SERVICE_ROLE_KEY`: that project's server-side service-role key.
- Repository variable `SITE_URL`: the matching site URL, used for signup links.

Require the **Result ingestion** commit status in the `main` branch ruleset. It
runs for every PR, including PRs without results, so a required status is never
missing due to path filters. The workflow itself must be on the default branch
before it can validate contributor PRs. A maintainer can use **Run workflow**
with a PR number to recheck after signup or retry ingestion after merge.

The privileged workflow uses `pull_request_target`, checks out only the default
branch, and never executes PR code or installs PR dependencies. It downloads
bounded JSON files at the head SHA for validation and the merge SHA for ingestion.
Do not change checkout to the PR head, download executable artifacts from PR CI,
or expose the server key to a browser build. Protect changes to this workflow,
its scripts, and database migrations through normal maintainer review.

`ingest_pr_results` is executable only by `service_role`. It joins the PR author's
numeric GitHub ID to `auth.identities(provider = 'github', provider_id)` and then
`profiles.auth_user_id`; profile handles and editable user metadata are never
identity proofs. An account without a linked GitHub identity fails with signup
instructions. Existing OAuth identities work without a profile backfill.

Validation runs the same database inserts and constraints as ingestion, then
rolls back the subtransaction. It leaves no results or receipts, although PostgreSQL
identity sequences can have gaps. Merge inserts the batch atomically and keeps
private receipts keyed by repository and filename. Retries of the same PR/payload
return the existing IDs. Receipts survive deleted results to prevent resurrection.
Different PRs or changed payloads cannot overwrite an imported path. JSON containing
`result` is an archive and never writes a result row. File removal does not delete
live rows. Previously submitted legacy PR evidence is detected to avoid reimporting it.

Rig registration and custom-runtime registration remain site operations. Referenced
catalog entries must already exist in both the trusted default-branch catalog and
the target database; merge/deploy catalog additions before submitting runs that use them.

Use staging first with a real GitHub OAuth account and owned rig to check the full
GitHub/Supabase integration. This change does not provision secrets, alter branch
protection, or automatically deploy migrations to production.

Run `npm --prefix frontend run results:test` for the local ingestion tests. They
load the application migrations into an isolated PGlite PostgreSQL instance with
a minimal Auth schema, then verify identity attribution, permissions, ownership,
rollback, archives, retries, and the GitHub file-loading flow. They do not contact
hosted Supabase or GitHub. Storage-specific migrations are outside this test scope.
