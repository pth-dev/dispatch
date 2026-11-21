import { useTranslation } from 'react-i18next'
import { RotateCcw, X } from 'lucide-react'
import { EMPTY_SITE_FILTER, type TaskListParams } from '@/schemas/task'
import type { DeptItem, SiteItem } from '@/schemas/meta'
import { STATUS_META } from '@/components/ui/status-text'
import { getDeptDisplayName, getSiteDisplayName } from '../api/meta'
import { formatBilingualOption } from '../api/task-catalog'
import {
  TASK_FLAG_LABEL_KEYS,
  type TaskFilterPatch,
} from '../hooks/use-task-list-params'

type ActiveChip = {
  key: string
  label: string
  onRemove: () => void
}

function FilterChip({ label, onRemove }: Omit<ActiveChip, 'key'>) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary-soft px-2 py-0.5 text-primary">
      <span className="max-w-[220px] truncate font-medium">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('tasks.filter.removeChip', { label })}
        className="inline-flex size-7 lg:size-5 items-center justify-center rounded hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </span>
  )
}

type ActiveFilterChipsProps = {
  params: TaskListParams
  departments: DeptItem[]
  sites: SiteItem[]
  onPatch: (patch: TaskFilterPatch) => void
  onReset: () => void
}

export function ActiveFilterChips({
  params,
  departments,
  sites,
  onPatch,
  onReset,
}: ActiveFilterChipsProps) {
  const { t, i18n } = useTranslation()
  const chips: ActiveChip[] = []

  if (params.search) {
    chips.push({
      key: 'search',
      label: `${t('common.search')}: "${params.search}"`,
      onRemove: () => onPatch({ search: undefined }),
    })
  }
  if (params.status) {
    const statusLabel =
      params.status === 'incomplete'
        ? t('status.incomplete')
        : params.status === 'completed'
          ? t('status.completed')
          : t(STATUS_META[params.status].labelKey)
    chips.push({
      key: 'status',
      label: `${t('common.status')}: ${statusLabel}`,
      onRemove: () => onPatch({ status: undefined }),
    })
  }
  if (params.department) {
    const dept = departments.find((d) => d.value === params.department)
    const label = dept ? getDeptDisplayName(dept, i18n.language) : params.department
    chips.push({
      key: 'department',
      label: `${t('common.department')}: ${label}`,
      onRemove: () => onPatch({ department: undefined }),
    })
  }
  if (params.fromDate) {
    chips.push({
      key: 'fromDate',
      label: `${t('tasks.filter.fromDate')}: ${params.fromDate}`,
      onRemove: () => onPatch({ fromDate: undefined }),
    })
  }
  if (params.toDate) {
    chips.push({
      key: 'toDate',
      label: `${t('tasks.filter.toDate')}: ${params.toDate}`,
      onRemove: () => onPatch({ toDate: undefined }),
    })
  }
  if (params.site) {
    const siteItem = sites.find((s) => s.value === params.site)
    const siteLabel =
      params.site === EMPTY_SITE_FILTER
        ? t('tasks.filter.siteEmpty')
        : siteItem
          ? getSiteDisplayName(siteItem, i18n.language)
          : params.site
    chips.push({
      key: 'site',
      label: `${t('tasks.filter.site')}: ${siteLabel}`,
      onRemove: () => onPatch({ site: undefined }),
    })
  }
  if (params.level) {
    const lvKey =
      params.level === 'critical'
        ? 'tasks.filter.levelCritical'
        : params.level === 'urgent'
          ? 'tasks.filter.levelUrgent'
          : 'tasks.filter.levelNormal'
    chips.push({
      key: 'level',
      label: `${t('tasks.filter.level')}: ${t(lvKey)}`,
      onRemove: () => onPatch({ level: undefined }),
    })
  }
  if (params.taskType) {
    chips.push({
      key: 'taskType',
      label: `${t('tasks.filter.taskType')}: ${formatBilingualOption(params.taskType, i18n.language)}`,
      onRemove: () => onPatch({ taskType: undefined }),
    })
  }
  if (params.confidential) {
    chips.push({
      key: 'confidential',
      label: `${t('tasks.confidential.label')}: ${t(`tasks.confidential.lv${params.confidential}`)}`,
      onRemove: () => onPatch({ confidential: undefined }),
    })
  }
  for (const flag of params.flags ?? []) {
    chips.push({
      key: `flag-${flag}`,
      label: t(TASK_FLAG_LABEL_KEYS[flag]),
      onRemove: () =>
        onPatch({ flags: (params.flags ?? []).filter((f) => f !== flag) }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
      {chips.map((chip) => (
        <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
      ))}
      <button
        type="button"
        onClick={onReset}
        className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 font-semibold text-primary hover:underline cursor-pointer"
      >
        <RotateCcw className="size-3" aria-hidden="true" />
        <span>{t('tasks.filter.clearAll')}</span>
      </button>
    </div>
  )
}
