import '@/i18n'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { RouterProvider } from '@/app/providers/RouterProvider'
import { AppErrorBoundary } from '@/components/layout/AppErrorBoundary'
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <RouterProvider />
        <Toaster />
      </QueryProvider>
    </AppErrorBoundary>
  )
}

export default App
