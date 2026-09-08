import { REPO } from '@/lib/brand'
import { RESULTS_DIR } from '@/lib/pr'

/*
  The prompt someone hands to their coding agent so it submits for them. The agent writes
  `results/<handle>/<name>.json` and opens a pull request; the repo's check validates the file and comments the
  `/submit?pr=N` link that finishes the submission on this page — the same pipeline a hand-written file goes through.

  Everything the site knows is substituted here: the handle decides the folder, and the rig is named by the id the
  file format expects. The wording itself belongs to the agent pipeline, so this is the one string to edit when it
  lands; nothing in the dialog reads it apart from the copy button.
*/
export function agentPrompt({ handle, rigId, rigName }: { handle: string; rigId: string; rigName: string }): string {
  const path = `${RESULTS_DIR}/${handle}/<name>.json`
  return `Submit my benchmark result to the Intelinside leaderboard.

Repo: https://github.com/${REPO}
Add one file at ${path} and open a pull request from my account.

The rig is already registered on the site, so name it as it is: "rig": "${rigId}" — my ${rigName}.
Read ${RESULTS_DIR}/README.md in that repo for the field list, and frontend/src/catalog/ for the model, quant
and runtime ids. Fill the file from my run: model, quant, runtime, runtimeVersion, decodeTps and runDate are
required; promptTps, ttftMs, contextLength, batchSize and runtimeFlags if the log has them.

Validate before you push:
  npm --prefix frontend run results:validate -- ${path}

Do not invent numbers. If a value is not in the log, ask me for it.`
}
