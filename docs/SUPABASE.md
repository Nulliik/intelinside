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
