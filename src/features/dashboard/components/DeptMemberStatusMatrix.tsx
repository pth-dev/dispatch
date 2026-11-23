import type * as React from 'react'
import { Link } from 'react-router'
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { APP_ROUTES } from '@/constants/app-routes'
import type { DirectoryUser } from '@/schemas/auth'
import { cn } from '@/utils/cn'
import {
  buildTaskDrilldownUrl,
  buildUserDirectoryLookup,
  resolveAssigneeIdentity,
  type DeptMemberStatusRow,
} from '../utils/dashboard-charts'

type DeptMemberStatusMatrixProps = {
  selectedDept: string
  memberRows: readonly DeptMemberStatusRow[]
  directoryUsers?: readonly DirectoryUser[]
}

function MatrixCellLink({
  count,
  href,
  toneClass,
}: {
  count: number
  href: string
  toneClass?: string
}): React.ReactElement {
  if (count <= 0) {
    return <span className="text-muted-foreground/40 tabular-nums">0</span>
  }
  return (
    <Link
      to={href}
      className={cn(
        'inline-block min-w-6 rounded px-1.5 py-0.5 font-semibold tabular-nums transition-colors hover:bg-secondary',
        toneClass ?? 'text-foreground',
      )}
    >
      {count}
    </Link>
  )
}

export function DeptMemberStatusMatrix({
  selectedDept,
  memberRows,
  directoryUsers = [],
}: DeptMemberStatusMatrixProps): React.ReactElement {
  const { t } = useTranslation()
  const visibleMembers = memberRows.slice(0, 12)
  const department = selectedDept || undefined
  const lookup = buildUserDirectoryLookup(directoryUsers)

  const cellUrl = (name: string, status?: string): string =>
    buildTaskDrilldownUrl(APP_ROUTES.TASKS, {
      scope: 'all',
      department,
      search: name,
      status,
    })

  const columns: ColumnDef<DeptMemberStatusRow>[] = [
    {
      id: 'person',
      header: t('dashboard.posts.cols.person'),
      meta: {
        headerClassName: 'px-3 py-2 font-semibold',
        cellClassName: 'px-3 py-1.5 font-medium text-foreground whitespace-nowrap',
      },
      cell: ({ row }) => {
        const identity = resolveAssigneeIdentity(row.original.name, lookup)
        return (
          <Link
            to={cellUrl(row.original.name)}
            className="inline-flex items-baseline gap-1.5 hover:text-primary hover:underline"
          >
            <span>{identity.name}</span>
            {identity.code && (
              <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
                {identity.code}
              </span>
            )}
          </Link>
        )
      },
    },
    {
      id: 'overdue',
      header: t('dashboard.dept.metrics.delayed'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2 font-semibold text-destructive',
        cellClassName: 'px-2 py-1.5',
      },
      cell: ({ row }) => (
        <MatrixCellLink
          count={row.original.overdue}
          toneClass="text-destructive"
          href={cellUrl(row.original.name, 'delayed_pending')}
        />
      ),
    },
    {
      id: 'inProgress',
      header: t('dashboard.dept.metrics.progress'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2 font-semibold text-primary',
        cellClassName: 'px-2 py-1.5',
      },
      cell: ({ row }) => (
        <MatrixCellLink
          count={row.original.inProgress}
          toneClass="text-primary"
          href={cellUrl(row.original.name, 'in_progress')}
        />
      ),
    },
    {
      id: 'notStarted',
      header: t('dashboard.dept.metrics.notStarted'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2 font-semibold',
        cellClassName: 'px-2 py-1.5',
      },
      cell: ({ row }) => (
        <MatrixCellLink
          count={row.original.notStarted}
          href={cellUrl(row.original.name, 'not_started')}
        />
      ),
    },
    {
      id: 'paused',
      header: t('dashboard.dept.metrics.paused'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2 font-semibold',
        cellClassName: 'px-2 py-1.5',
      },
      cell: ({ row }) => (
        <MatrixCellLink
          count={row.original.paused}
          toneClass="text-muted-foreground"
          href={cellUrl(row.original.name, 'paused')}
        />
      ),
    },
    {
      id: 'completed',
      header: t('dashboard.dept.metrics.completed'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2 font-semibold text-success',
        cellClassName: 'px-2 py-1.5',
      },
      cell: ({ row }) => (
        <MatrixCellLink
          count={row.original.completed}
          toneClass="text-success"
          href={cellUrl(row.original.name, 'completed')}
        />
      ),
    },
    {
      id: 'open',
      header: t('dashboard.dept.metrics.openTotal'),
      meta: {
        align: 'right',
        headerClassName: 'px-3 py-2 font-semibold',
        cellClassName: 'px-3 py-1.5',
      },
      cell: ({ row }) => (
        <MatrixCellLink
          count={row.original.open}
          href={cellUrl(row.original.name, 'incomplete')}
        />
      ),
    },
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Users className="size-3.5 text-primary" aria-hidden="true" />
          <span>{t('dashboard.dept.statusMatrixTitle')}</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t('dashboard.scopeBadge.live')}
          </span>
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {t('dashboard.dept.statusMatrixHint')}
        </span>
      </div>

      {visibleMembers.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t('dashboard.dept.peopleLoadEmpty')}
        </p>
      ) : (
        <DataTable
          variant="embedded"
          data={visibleMembers}
          columns={columns}
          keyExtractor={(row) => row.name}
          containerClassName="rounded-lg border border-border"
          headerClassName="bg-secondary/60 text-xs"
          rowClassName={() => 'hover:bg-secondary/40'}
        />
      )}
    </div>
  )
}
