import { Award, Copy, Download, Plus, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { APP_ROUTES } from '@/constants/app-routes'
import type { SessionUser } from '@/schemas/auth'
import { cn } from '@/utils/cn'
import { canReadMenu, canWriteMenu } from '@/utils/permissions'
import type { BriefView } from '../utils/kpi-brief-domain'

export interface KpiBriefHeaderActionsProps {
  user: SessionUser | null
  view: BriefView
  viewOptions: readonly { value: BriefView; label: string }[]
  isFetching: boolean
  onViewChange: (view: BriefView) => void
  onCopyTsv: () => void
  onExportPeopleCsv: () => void
  onExportUnfinishedCsv: () => void
  onRefresh: () => void
}

export function KpiBriefHeaderActions({
  user,
  view,
  viewOptions,
  isFetching,
  onViewChange,
  onCopyTsv,
  onExportPeopleCsv,
  onExportUnfinishedCsv,
  onRefresh,
}: KpiBriefHeaderActionsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label={t('kpiBrief.views.label')}
        value={view}
        onChange={(e) => onViewChange(e.target.value as BriefView)}
        className="h-11 lg:h-10 rounded-md border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {viewOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <Button type="button" variant="outline" size="sm" onClick={onCopyTsv}>
        <Copy className="size-4" aria-hidden="true" />
        {t('kpiBrief.actions.copyTable')}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Download className="size-4" aria-hidden="true" />
            {t('kpi.actions.export')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportPeopleCsv}>
            <Download className="mr-2 size-4" aria-hidden="true" />
            {t('kpiBrief.actions.exportPeopleCsv')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportUnfinishedCsv}>
            <Download className="mr-2 size-4" aria-hidden="true" />
            {t('kpiBrief.actions.exportUnfinishedCsv')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isFetching}
        aria-label={t('kpi.actions.refresh')}
      >
        <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} aria-hidden="true" />
      </Button>

      {canReadMenu(user, 'kpi_people') && (
        <Button asChild variant="outline" size="sm">
          <Link to={APP_ROUTES.KPI}>
            <Award className="size-4" aria-hidden="true" />
            {t('kpiBrief.actions.openFullKpi')}
          </Link>
        </Button>
      )}

      {canWriteMenu(user, 'dashboard') && (
        <Button asChild size="sm">
          <Link to={APP_ROUTES.TASK_NEW}>
            <Plus className="size-4" aria-hidden="true" />
            {t('kpiBrief.actions.newTask')}
          </Link>
        </Button>
      )}
    </div>
  )
}
