import '@/i18n'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { RouterProvider } from '@/app/providers/RouterProvider'
import { AppErrorBoundary } from '@/components/layout/AppErrorBoundary'

function App() {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <RouterProvider />
      </QueryProvider>
    </AppErrorBoundary>
  )
}

export default App
