import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { Block, Section } from '@/components/frame'
import { usePageTitle } from '@/hooks/usePageTitle'
import { BRAND_NAME, CASCADIA_URL, CATALOG_REPO_URL } from '@/lib/brand'

const prose = 'max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4'

export function Guidelines() {
  usePageTitle('Guidelines')
  return (
    <div>
      <PageHeader eyebrow="Guidelines" title={<><span className="text-muted-foreground">What to submit,</span> how it ranks, what gets flagged.</>} />
      <Section>
        <Block className={prose}>
          <h2>What a result is</h2>
          <p>One model at one quantization, on one runtime, on either your whole rig or one part inside it. The headline number is decode speed in tokens per second. Prompt-processing speed and time to first token are welcome but optional.</p>
          <h2>How to measure decode tok/s</h2>
          <ul>
            <li>Generate at least 256 tokens from a short prompt and average over a few runs.</li>
            <li>Report the runtime version you used and link the repo you ran in, yours or the runtime's.</li>
            <li>If you ran on one card out of several, submit it as a component result and set the quantity you used.</li>
          </ul>
          <h2>Ranking</h2>
          <p>Each rig, or each part at a given quantity, appears once on a board at its best decode tok/s. The earliest run wins a tie. Boards mix runtimes; filter by runtime to compare like with like.</p>
          <h2>Verification</h2>
          <p>Every result starts self-reported. When enough signed-in members confirm it, it becomes community-verified. Confirm only what you reproduced or checked.</p>
          <h2>Flags</h2>
          <p>Flag numbers that look implausible, wrong hardware, duplicates, or spam. Past a few flags an entry is hidden until the team reviews it.</p>
          <h2>Adding hardware or models</h2>
          <p>The catalog is open source. Open a pull request at <a href={CATALOG_REPO_URL} target="_blank" rel="noreferrer">the catalog repo</a> with the part or model and it shows up here after the next sync.</p>
        </Block>
      </Section>
    </div>
  )
}

export function About() {
  usePageTitle('About')
  return (
    <div>
      <PageHeader eyebrow="About" title={<><span className="text-muted-foreground">A community leaderboard of AI inference</span> on real hardware.</>} />
      <Section>
        <Block className={prose}>
          <p>People sign in with GitHub, register the machines they run models on, and post the tokens per second they get for a model at a given quantization on a given runtime. Rigs decompose into parts, so a result can describe the whole machine or a single card inside it.</p>
          <p>Results are self-reported and checked by the community. Nothing here is a lab benchmark, and that is the point: it is what people actually see on hardware they actually own.</p>
          <p>The hardware database is open source and grows by pull request. Any vendor is welcome.</p>
          <p>{BRAND_NAME} is powered by <a href={CASCADIA_URL} target="_blank" rel="noreferrer">Cascadia</a>.</p>
          <div className="pt-2">
            <Button render={<Link to="/models" />} nativeButton={false}>Browse the boards</Button>
          </div>
        </Block>
      </Section>
    </div>
  )
}

export function NotFound() {
  usePageTitle('Not found')
  return (
    <Block className="py-24 text-center">
      <div className="font-mono text-6xl font-semibold text-muted-foreground">404</div>
      <p className="mt-3 text-sm text-muted-foreground">That page does not exist, or it was hidden.</p>
      <Button className="mt-6" variant="outline" render={<Link to="/" />} nativeButton={false}>Back home</Button>
    </Block>
  )
}

