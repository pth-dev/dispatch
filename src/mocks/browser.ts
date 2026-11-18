import { setupWorker } from 'msw/browser'
import { taskHandlers } from './handlers/tasks'

export const worker = setupWorker(...taskHandlers)
