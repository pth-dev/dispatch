import * as React from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { DevPanel } from './DevPanel'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'

export function AppShell() {
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
          <SheetTitle className="sr-only">Menu Điều Phối</SheetTitle>
          <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 bg-background">
          <React.Suspense
            fallback={
              <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                Đang tải dữ liệu trang...
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </main>
      </div>

      {/* DEV Mock & Role Simulation Panel */}
      <DevPanel />
    </div>
  )
}

export default AppShell
