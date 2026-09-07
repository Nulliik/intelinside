# Results by pull request

Every result on the site can also live here as a file, and a file here can become a result on the site. Two directions, one format.

## Add a result from a file

1. Sign in on the site once so your GitHub handle has a profile, and register the rig you ran on. The rig's URL ends in a number; that number (or the rig's exact name) goes in the file.
2. Add `results/<your-github-handle>/<name>.json`:

   ```json
   {
     "$schema": "https://raw.githubusercontent.com/labscommunity/intelinside/main/results/schema.json",
     "rig": "12",
     "component": "intel-arc-b580",
     "componentQuantity": 1,
     "model": "qwen3-8b",
     "quant": "q4_k_m",
     "runtime": "llamacpp",
     "runtimeVersion": "b6512",
     "runtimeFlags": "-fa 1 -ngl 99, SYCL backend",
     "decodeTps": 34.2,
     "promptTps": 410,
     "ttftMs": 120,
     "contextLength": 4096,
     "batchSize": 1,
     "runDate": "2026-09-04",
     "notes": "Fresh driver, no thermal throttling."
   }
   ```

   `runtimeFlags` is optional free text: the settings and build options that would change the number if someone
   rebuilt it. Leave `component` out for a whole-rig result. Ids come from [the catalog](../frontend/src/catalog/); the site's hardware pages show each part's id in the URL. Missing a part? [Add it](../frontend/src/catalog/README.md) in the same pull request.

3. Open a pull request. A check validates the file against the catalog and comments with a link like `/submit?pr=123`.
4. Open that link. The submit form fills itself from your file, with the pull request as the evidence link. Check the numbers and submit. The result ranks the moment it is in.

### Stock or a build

A run on the released runtime needs nothing extra. If you ran a changed runtime — a custom kernel or op, a patch,
a fork — name the build it ran on and the revision behind it:

```json
{
  "build": "7",
  "revision": "a8192fe"
}
```

`build` is the number at the end of the build's URL on the site, or its exact name, the same way `rig` works.
Register the build once on the site and every later result just names it. You can post against anyone's build, not
only your own — a public fork is a real thing anyone can run, and one object per fork is what keeps those runs
comparable.

The revision is the point. An implementation changes week to week, so "a custom attention kernel" is not
reproducible and `a8192fe` is. A commit, a tag, or a build id all work.

Boards rank stock runs against each other and keep builds out unless a reader turns on **Include modified**, so a
changed stack is never mistaken for faster silicon. Builds are not lesser and nothing is hidden — they answer a
different question, rank among each other on the same board, and collect on the build's own page.

The pull request stays as the public record of the run. Merging it is up to the maintainers and changes nothing on the site.

The form also accepts a pull request link or number by hand, at the top of the submit page.

## Write the file from a result

Every freshly submitted result offers **Add to the results repo**, which opens GitHub's new-file page with the JSON filled in, path and all. GitHub forks the repo for you if you cannot push to it. The file then carries a `result` link back to the live entry.

## Rules

- Files live at `results/<your-github-handle>/<name>.json`. The check fails if the folder does not match the pull request author.
- Results are your own runs on your own rig. The site enforces rig ownership when the result is submitted.
- One result per file. Several files in one pull request are fine; the form lets you pick which one to fill from.
- [`schema.json`](schema.json) describes the shape for editors. Run the same check locally with `npm --prefix frontend run results:validate -- results/<handle>/<name>.json`.
