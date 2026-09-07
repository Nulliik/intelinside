import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/PageHeader'
import { CustomRuntimeForm } from '@/components/CustomRuntimeForm'
import { SignInGate } from '@/components/SignInGate'
import { ErrorState } from '@/components/ErrorState'
import { Block, Section } from '@/components/frame'
import { customRuntimeHref } from '@/components/CustomRuntimeLink'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'

/**
 * Registering or editing a custom runtime on its own page. The submit form keeps its inline version so nobody has to leave a
 * half-filled result; this is the way in from a runtime page, a profile, or a link someone sent you.
 */
export default function CustomRuntimeEditor() {
  const { runtimeId, customId } = useParams()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading } = useSession()
  const existing = useAsync(() => (customId ? api.customRuntime(customId) : Promise.resolve(null)), [customId])
  usePageTitle(customId ? 'Edit custom runtime' : 'Register a custom runtime')

  if (loading || (customId && existing.loading))
    return (
      <Block>
        <Skeleton className="h-96" />
      </Block>
    )
  if (!user) return <SignInGate what={customId ? 'edit this custom runtime' : 'register a custom runtime'} />
  if (customId && existing.error)
    return (
      <Block>
        <ErrorState error={existing.error} />
      </Block>
    )
  if (customId && existing.data && existing.data.ownerId !== user.id)
    return (
      <Block>
        <ErrorState error={new Error('Only the owner can edit this custom runtime.')} />
      </Block>
    )

  const customRuntime = existing.data ?? undefined

  return (
    <div>
      <PageHeader
        eyebrow={customId ? 'Edit custom runtime' : 'Register a custom runtime'}
        title={customId ? customRuntime?.name ?? 'Edit custom runtime' : 'A runtime you changed.'}
        description={
          customId
            ? 'Results already posted against it keep their own revisions; editing here changes what it is, not what any run measured.'
            : 'A custom kernel or op, a patch, a fork. Register it once and every result you post on it just names it.'
        }
      />
      <Section rule="both">
        <Block>
          <CustomRuntimeForm
            build={customRuntime}
            runtimeId={runtimeId ?? sp.get('runtime') ?? undefined}
            onCancel={() => navigate(-1)}
            onCreated={(saved) => navigate(customRuntimeHref(saved))}
          />
        </Block>
      </Section>
    </div>
  )
}
