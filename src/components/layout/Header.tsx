import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import {
  Menu,
  ChevronDown,
  User,
  LogOut,
  Building2,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Logo } from './Logo'
import { queryClient } from '@/app/providers/query-client'
import { useAppStore, type SupportedLocale } from '@/app/store'
import { APP_ROUTES } from '@/constants/app-routes'
import { LANGUAGE_OPTIONS } from '@/i18n'
import { logoutSession } from '@/services'

type HeaderProps = {
  onOpenMobileMenu?: () => void
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const setLocale = useAppStore((s) => s.setLocale)
  const clearSession = useAppStore((s) => s.clearSession)

  const displayName = user?.fullname || user?.username || ''
  const initial = displayName.charAt(0).toUpperCase() || 'U'
  const roleKey = user ? `role.${user.role}` : 'role.user'

  const handleLanguageChange = (lang: SupportedLocale) => {
    void i18n.changeLanguage(lang)
    setLocale(lang)
  }

  const handleLogout = async () => {
    await logoutSession(false)
    queryClient.clear()
    clearSession()
    navigate(APP_ROUTES.LOGIN, { replace: true })
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6 select-none">
      {/* Mobile Header Elements */}
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

      {/* Desktop Left: Department / Scope View */}
      <div className="hidden lg:flex items-center gap-3">
        {user?.dept && (
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5 text-primary" />
            <span>{t('header.currentView')}</span>
            <span className="font-semibold text-foreground">{user.dept}</span>
          </div>
        )}
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Language Switcher (4 locales) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              aria-label={t('header.changeLanguage')}
            >
              <Globe className="size-3.5" />
              <span className="uppercase font-semibold text-[11px]">{i18n.language}</span>
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            {LANGUAGE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.code}
                onClick={() => handleLanguageChange(opt.code)}
                className={i18n.language === opt.code ? 'bg-primary-soft text-primary font-medium' : ''}
              >
                {t(opt.labelKey)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2.5 rounded-full p-0.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary select-none cursor-pointer"
              aria-label={t('header.userMenu')}
            >
              <Avatar className="size-8 border border-border">
                <AvatarFallback className="bg-primary-soft text-primary font-semibold text-xs">
                  {initial}
                </AvatarFallback>
              </Avatar>

              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-primary leading-tight">
                  {t('header.greeting', { name: displayName })}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {t(roleKey)}
                </span>
              </div>

              <ChevronDown className="hidden lg:block size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 text-xs">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold text-foreground leading-none">{displayName}</p>
                <p className="text-[11px] leading-none text-muted-foreground">
                  {t('header.userCode', { code: user?.username ?? '-' })}
                  {user?.dept ? ` • ${user.dept}` : ''}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to={APP_ROUTES.PROFILE} className="flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground" />
                <span>{t('nav.profile')}</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void handleLogout()}
              className="text-destructive flex items-center gap-2"
            >
              <LogOut className="size-3.5" />
              <span>{t('nav.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
