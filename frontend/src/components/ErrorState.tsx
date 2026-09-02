import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ApiError } from '@/lib/api/types'

export function ErrorState({ error }: { error: Error }) {
  const notFound = error instanceof ApiError && error.status === 404
  return (
    <Alert variant="destructive" className="my-6">
      <AlertTitle>{notFound ? 'Not found' : 'Something went wrong'}</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )
}
