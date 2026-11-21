import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSessionLifecycle } from '@/hooks/use-session-lifecycle'
import { useAppStore } from '@/app/store'

export function AppShell() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const authStatus = useAppStore((s) => s.authStatus)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const isDrawerOpen = isMobile && mobileMenuOpen

  useSessionLifecycle()

  if (authStatus === 'checking') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-xs text-muted-foreground">
        {t('common.loading')}
      </div>
    )
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
        <SheetContent side="left" className="p-0 w-[296px] bg-card border-r border-border">
          <SheetTitle className="sr-only">{t('sidebar.menuTitle')}</SheetTitle>
          <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Fixed-height scroll area; padding lives here and nowhere else. */}
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background px-4 py-4 lg:px-6 short:py-3">
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
    </div>
  )
}

export default AppShell
