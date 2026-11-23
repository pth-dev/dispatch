import { useRouteError } from 'react-router'
import { ErrorState } from './ErrorState'
import { toErrorStatus, type ErrorStatusCode } from './error-status'

const CHUNK_LOAD_ERROR =
  /failed to fetch dynamically imported module|loading chunk|importing a module script failed/i

/**
 * Root Error Boundary component used by React Router `errorElement`.
 */
export function RootRouteErrorBoundary() {
  const error = useRouteError()

  const errorMessage =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : ''

  // Lazy-chunk load failures are network failures (brief §5.12).
  const status: ErrorStatusCode = CHUNK_LOAD_ERROR.test(errorMessage)
    ? 'network'
    : toErrorStatus(error)

  return <ErrorState status={status} />
}
