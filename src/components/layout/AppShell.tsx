import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ErrorState } from './ErrorState'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { useMainScrollRestoration } from '@/hooks/use-main-scroll-restoration'
import { useSessionLifecycle } from '@/hooks/use-session-lifecycle'
import { useAppStore } from '@/app/store'

export function AppShell() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const authStatus = useAppStore((s) => s.authStatus)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const mainRef = React.useRef<HTMLElement>(null)
  const isDrawerOpen = isMobile && mobileMenuOpen

  const { retryVerify } = useSessionLifecycle()
  useMainScrollRestoration(mainRef, authStatus === 'authenticated')

  if (authStatus === 'checking') {
    return (
      <div
        role="status"
        className="flex min-h-dvh items-center justify-center bg-background text-xs text-muted-foreground"
      >
        {t('common.loading')}
      </div>
    )
  }

  if (authStatus === 'offline') {
    return <ErrorState status="network" onRetry={retryVerify} />
  }

  if (authStatus !== 'authenticated') {
    return null
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isDrawerOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[260px] max-w-[85vw] bg-card border-r border-border">
          <SheetTitle className="sr-only">{t('sidebar.menuTitle')}</SheetTitle>
          <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Fixed-height scroll area on desktop (inner PageContainer scrolls); short desktop & mobile scroll on <main> when needed. */}
        <main
          ref={mainRef}
          className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background px-4 py-4 lg:overflow-hidden lg:short:overflow-y-auto lg:px-6 short:py-3"
        >
          <React.Suspense
            fallback={
              <div
                role="status"
                className="flex h-32 items-center justify-center text-xs text-muted-foreground"
              >
                {t('common.loadingPage')}
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  )
}
