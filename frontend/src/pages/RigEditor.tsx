import { useNavigate, useParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/PageHeader'
import { RigForm } from '@/components/RigForm'
import { SignInGate } from '@/components/SignInGate'
import { ErrorState } from '@/components/ErrorState'
import { Block, Section } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'

export default function RigEditor() {
  const { rigId } = useParams()
  const navigate = useNavigate()
  const { user, loading } = useSession()
  const existing = useAsync(() => (rigId ? api.rig(rigId) : Promise.resolve(null)), [rigId])
  usePageTitle(rigId ? 'Edit rig' : 'New rig')

  if (loading || (rigId && existing.loading))
    return (
      <Block>
        <Skeleton className="h-96" />
      </Block>
    )
  if (!user) return <SignInGate what={rigId ? 'edit this rig' : 'register a rig'} />
  if (rigId && existing.error)
    return (
      <Block>
        <ErrorState error={existing.error} />
      </Block>
    )
  if (rigId && existing.data && existing.data.ownerId !== user.id)
    return (
      <Block>
        <ErrorState error={new Error('Only the owner can edit this rig.')} />
      </Block>
    )

  return (
    <div>
      <PageHeader
        eyebrow={rigId ? 'Edit rig' : 'New rig'}
        title={rigId ? existing.data?.name ?? 'Edit rig' : <><span className="text-muted-foreground">What is in the machine,</span> part by part.</>}
        description="Results are submitted against a rig, or against one part inside it. Quantities matter: four cards and one card rank separately."
      />
      <Section>
        <Block>
          <div className="max-w-3xl">
            <RigForm
              initial={existing.data ?? undefined}
              submitLabel={rigId ? 'Save changes' : 'Create rig'}
              onSaved={(rig) => navigate(`/rigs/${rig.id}`)}
              onCancel={() => navigate(rigId ? `/rigs/${rigId}` : '/rigs')}
            />
          </div>
        </Block>
      </Section>
    </div>
  )
}
