import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { ChevronDown, LogOut, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { queryClient } from '@/app/providers/query-client'
import { useAppStore } from '@/app/store'
import { APP_ROUTES } from '@/constants/app-routes'
import { logoutSession } from '@/services'

export function UserMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const clearSession = useAppStore((s) => s.clearSession)

  const displayName = user?.fullname || user?.username || ''
  const initial = displayName.charAt(0).toUpperCase() || 'U'
  const roleKey = user ? `role.${user.role}` : 'role.user'

  const handleLogout = async () => {
    await logoutSession(false)
    queryClient.clear()
    clearSession()
    navigate(APP_ROUTES.LOGIN, { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 min-w-11 lg:min-h-0 lg:min-w-0 items-center justify-center gap-2.5 rounded-full p-0.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary select-none cursor-pointer"
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

          <ChevronDown className="hidden lg:block size-3.5 text-muted-foreground" aria-hidden="true" />
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
            <User className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span>{t('nav.profile')}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void handleLogout()}
          className="text-destructive flex items-center gap-2"
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          <span>{t('nav.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
