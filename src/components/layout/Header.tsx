import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Building2, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'
import { LanguageSwitcher } from './LanguageSwitcher'
import { UserMenu } from './UserMenu'
import { useAppStore } from '@/app/store'

type HeaderProps = {
  onOpenMobileMenu?: () => void
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { t } = useTranslation()
  const user = useAppStore((s) => s.user)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6 select-none">
      <div className="flex items-center gap-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="size-10 min-h-[44px] min-w-[44px] p-0"
          aria-label={t('header.openMenu')}
        >
          <Menu className="size-6 text-foreground" />
        </Button>
        <Link to="/" className="flex items-center">
          <Logo size={32} />
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-3">
        {user?.dept && (
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5 text-primary" />
            <span>{t('header.currentView')}</span>
            <span className="font-semibold text-foreground">{user.dept}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  )
}
