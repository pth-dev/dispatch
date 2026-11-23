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

  let technical = ''

  if (typeof error === 'object' && error !== null && 'message' in error) {
    technical = String((error as { message: unknown }).message)
  }
  if (typeof error === 'object' && error !== null && 'stack' in error) {
    technical += `\n${String((error as { stack: unknown }).stack)}`
  }

  // Lazy-chunk load failures are network failures (brief §5.12).
  const status: ErrorStatusCode = CHUNK_LOAD_ERROR.test(technical)
    ? 'network'
    : toErrorStatus(error)

  return <ErrorState status={status} technicalDetails={technical} />
}
