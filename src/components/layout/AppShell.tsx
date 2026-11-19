import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * Dev-only tooling. `import.meta.env.DEV` is a static `false` in production, so
 * Rollup drops the lazy import and the panel never reaches a production bundle.
 */
const DevPanel = import.meta.env.DEV
  ? React.lazy(() =>
      import('./DevPanel').then((module) => ({ default: module.DevPanel })),
    )
  : null

export function AppShell() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const isDrawerOpen = isMobile && mobileMenuOpen

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isDrawerOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[296px] bg-card border-r border-border">
          <SheetTitle className="sr-only">{t('sidebar.menuTitle')}</SheetTitle>
          <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Fixed-height scroll area; padding lives here and nowhere else. */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background px-4 py-4 lg:px-6 short:py-3">
          <React.Suspense
            fallback={
              <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                {t('common.loadingPage')}
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </main>
      </div>

      {/* DEV Mock & Role Simulation Panel */}
      {DevPanel && (
        <React.Suspense fallback={null}>
          <DevPanel />
        </React.Suspense>
      )}
    </div>
  )
}

export default AppShell
