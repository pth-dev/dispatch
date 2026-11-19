import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import {
  Bell,
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
import { useAppStore, type UserRole, type SupportedLocale } from '@/app/store'
import { APP_ROUTES } from '@/constants/app-routes'

interface HeaderProps {
  onOpenMobileMenu?: () => void
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, setRole, setLocale } = useAppStore()

  const handleLanguageChange = (lang: SupportedLocale) => {
    i18n.changeLanguage(lang)
    setLocale(lang)
  }

  const handleRoleChange = (role: UserRole) => {
    setRole(role)
  }

  const handleLogout = () => {
    navigate(APP_ROUTES.LOGIN)
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
        <div className="flex items-center gap-2 rounded-md bg-[#F3F4F8] px-3 py-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3.5 text-primary" />
          <span>{t('header.currentView')}</span>
          <span className="font-semibold text-foreground">
            {user.department}
          </span>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Language Switcher */}
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
            <DropdownMenuItem onClick={() => handleLanguageChange('vi')}>
              {t('language.vi')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
              {t('language.en')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('zh-CN')}>
              {t('language.zhCN')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 min-h-[44px] min-w-[44px] p-0 text-muted-foreground hover:text-foreground"
          aria-label={t('header.notifications')}
        >
          <Bell className="size-5" />
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-red-600 ring-2 ring-card" />
        </Button>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2.5 rounded-full p-0.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary select-none cursor-pointer"
              aria-label={t('header.userMenu')}
            >
              <Avatar className="size-8 border border-border">
                <AvatarFallback className="bg-primary-soft text-primary font-semibold text-xs">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-primary leading-tight">
                  {t('header.greeting', { name: user.name })}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {t(`role.${user.role}`)}
                </span>
              </div>

              <ChevronDown className="hidden lg:block size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 text-xs">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold text-foreground leading-none">{user.name}</p>
                <p className="text-[11px] leading-none text-muted-foreground">
                  {t('header.userCode', { code: user.code })} • {user.department}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Quick Switch Role (for dev testing) */}
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {t('header.devRoleSwitch')}
            </DropdownMenuLabel>
            {(['employee', 'approver', 'manager', 'admin'] as UserRole[]).map(
              (r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={r === user.role ? 'bg-primary-soft text-primary font-semibold' : ''}
                >
                  {t(`role.${r}`)}
                </DropdownMenuItem>
              )
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={APP_ROUTES.PROFILE} className="flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground" />
                <span>{t('nav.profile')}</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive flex items-center gap-2">
              <LogOut className="size-3.5" />
              <span>{t('nav.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
