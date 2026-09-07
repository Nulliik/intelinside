import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/PageHeader'
import { BuildForm } from '@/components/BuildForm'
import { SignInGate } from '@/components/SignInGate'
import { ErrorState } from '@/components/ErrorState'
import { Block, Section } from '@/components/frame'
import { buildHref } from '@/components/BuildLink'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'

/**
 * Registering or editing a build on its own page. The submit form keeps its inline version so nobody has to leave a
 * half-filled result; this is the way in from a runtime page, a profile, or a link someone sent you.
 */
export default function BuildEditor() {
  const { runtimeId, buildId } = useParams()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading } = useSession()
  const existing = useAsync(() => (buildId ? api.customRuntime(buildId) : Promise.resolve(null)), [buildId])
  usePageTitle(buildId ? 'Edit build' : 'Register a build')

  if (loading || (buildId && existing.loading))
    return (
      <Block>
        <Skeleton className="h-96" />
      </Block>
    )
  if (!user) return <SignInGate what={buildId ? 'edit this build' : 'register a build'} />
  if (buildId && existing.error)
    return (
      <Block>
        <ErrorState error={existing.error} />
      </Block>
    )
  if (buildId && existing.data && existing.data.ownerId !== user.id)
    return (
      <Block>
        <ErrorState error={new Error('Only the owner can edit this build.')} />
      </Block>
    )

  const build = existing.data ?? undefined

  return (
    <div>
      <PageHeader
        eyebrow={buildId ? 'Edit build' : 'Register a build'}
        title={buildId ? build?.name ?? 'Edit build' : 'A runtime you changed.'}
        description={
          buildId
            ? 'Results already posted against it keep their own revisions; editing here changes what the build is, not what any run measured.'
            : 'A custom kernel or op, a patch, a fork. Register it once and every result you post on it just names it.'
        }
      />
      <Section rule="both">
        <Block>
          <BuildForm
            build={build}
            runtimeId={runtimeId ?? sp.get('runtime') ?? undefined}
            onCancel={() => navigate(-1)}
            onCreated={(saved) => navigate(buildHref(saved))}
          />
        </Block>
      </Section>
    </div>
  )
}
