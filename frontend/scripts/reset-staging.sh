#!/usr/bin/env bash
set -euo pipefail

readonly STAGING_PROJECT_REF="ujlacyedspjfekotemmd"
readonly PRODUCTION_PROJECT_REF="xnzhdnudmgquuwdpuisy"
readonly CONFIRMATION="RESET-STAGING"

if [[ "$STAGING_PROJECT_REF" == "$PRODUCTION_PROJECT_REF" ]]; then
  echo "Refusing to reset: staging and production project refs match." >&2
  exit 1
fi

if [[ "${1:-}" != "$CONFIRMATION" ]]; then
  echo "This resets only the hosted staging database and reapplies repository migrations."
  echo "Run: npm run supabase:db:reset:staging -- $CONFIRMATION"
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
workspace_dir="$(cd "$script_dir/../.." && pwd)"
cli="$workspace_dir/frontend/node_modules/.bin/supabase"

if [[ ! -x "$cli" ]]; then
  echo "Supabase CLI is missing. Run npm install in frontend/." >&2
  exit 1
fi

echo "Reset target: staging ($STAGING_PROJECT_REF)"
echo "Production remains untouched ($PRODUCTION_PROJECT_REF)."

"$cli" --workdir "$workspace_dir" db reset \
  --project-ref "$STAGING_PROJECT_REF" \
  --no-seed
