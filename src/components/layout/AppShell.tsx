import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ErrorState } from './ErrorState'
import { ScrollToTopButton } from './ScrollToTopButton'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { useMainScrollRestoration } from '@/hooks/use-main-scroll-restoration'
import { useSessionLifecycle } from '@/hooks/use-session-lifecycle'
import { useAppStore } from '@/app/store'

export function AppShell() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const isMobile = useIsMobile()
  const authStatus = useAppStore((s) => s.authStatus)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const mainRef = React.useRef<HTMLElement>(null)
  const isDrawerOpen = isMobile && mobileMenuOpen
  const hasStickyBottomBar =
    pathname === '/tasks/new' || /^\/tasks\/\d+\/edit$/.test(pathname)

  const { retryVerify } = useSessionLifecycle()
  useAutoRefresh(authStatus === 'authenticated')
  useMainScrollRestoration(mainRef, authStatus === 'authenticated')

  if (authStatus === 'checking') {
    return <LoadingSpinner size="lg" className="min-h-dvh bg-background" />
  }

  if (authStatus === 'offline') {
    return <ErrorState status="network" onRetry={retryVerify} />
  }

  if (authStatus !== 'authenticated') {
    return null
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background print:block print:h-auto print:overflow-visible">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex lg:shrink-0 print:hidden">
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
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:block print:overflow-visible">
        <div className="print:hidden">
          <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        </div>

        {/* Fixed-height scroll area on desktop (inner PageContainer scrolls); short desktop & mobile scroll on <main> when needed. */}
        <main
          ref={mainRef}
          className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background px-4 pt-4 pb-20 lg:overflow-hidden lg:short:overflow-y-auto lg:px-6 lg:py-4 short:py-3 print:block print:overflow-visible print:p-0"
        >
          <React.Suspense
            fallback={<LoadingSpinner size="md" label={t('common.loadingPage')} className="h-32" />}
          >
            <Outlet />
          </React.Suspense>
        </main>

        <ScrollToTopButton scrollContainerRef={mainRef} elevated={hasStickyBottomBar} />
      </div>
    </div>
  )
}
