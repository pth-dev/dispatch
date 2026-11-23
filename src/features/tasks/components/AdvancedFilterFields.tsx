import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/app/store'
import {
  EMPTY_SITE_FILTER,
  TASK_FLAG_FILTERS,
  type TaskFlagFilter,
  type TaskListParams,
} from '@/schemas/task'
import type { SiteItem } from '@/schemas/meta'
import { isSuperLike } from '@/utils/permissions'
import { cn } from '@/utils'
import { getSiteDisplayName } from '../api/meta'
import { formatBilingualOption } from '../api/task-catalog'
import {
  TASK_FLAG_LABEL_KEYS,
  type TaskFilterPatch,
} from '../hooks/use-task-list-params'

type FlagToggleButtonProps = {
  flag: TaskFlagFilter
  active: boolean
  onToggle: (flag: TaskFlagFilter) => void
}

function FlagToggleButton({ flag, active, onToggle }: FlagToggleButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onToggle(flag)}
      className={cn(
        'min-h-[34px] rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary-soft text-primary'
          : 'border-border bg-card text-foreground hover:bg-secondary',
      )}
    >
      {t(TASK_FLAG_LABEL_KEYS[flag])}
    </button>
  )
}

type AdvancedFilterFieldsProps = {
  idPrefix: string
  params: TaskListParams
  sites: SiteItem[]
  availableTaskTypes: string[]
  dateRangeError: boolean
  onPatch: (patch: TaskFilterPatch) => void
  onDateChange: (field: 'fromDate' | 'toDate', value: string) => void
}

export function AdvancedFilterFields({
  idPrefix,
  params,
  sites,
  availableTaskTypes,
  dateRangeError,
  onPatch,
  onDateChange,
}: AdvancedFilterFieldsProps) {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const canSeeTopSecret = isSuperLike(user)
  const activeFlags = params.flags ?? []

  const toggleFlag = (flag: TaskFlagFilter) => {
    const next = activeFlags.includes(flag)
      ? activeFlags.filter((f) => f !== flag)
      : [...activeFlags, flag]
    onPatch({ flags: next })
  }

  return (
    <div className="w-full min-w-0 space-y-3.5 text-xs">
      {/* Thời gian */}
      <div className="w-full min-w-0 space-y-1.5">
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="w-full min-w-0 space-y-1">
            <label htmlFor={`${idPrefix}-from`} className="font-semibold text-muted-foreground">
              {t('tasks.filter.fromDate')}
            </label>
            <Input
              id={`${idPrefix}-from`}
              type="date"
              value={params.fromDate ?? ''}
              onChange={(e) => onDateChange('fromDate', e.target.value)}
              className="flex w-full max-w-full min-w-0 items-center box-border appearance-none h-11 lg:h-10 text-base lg:text-xs [&::-webkit-date-and-time-value]:text-left"
            />
          </div>
          <div className="w-full min-w-0 space-y-1">
            <label htmlFor={`${idPrefix}-to`} className="font-semibold text-muted-foreground">
              {t('tasks.filter.toDate')}
            </label>
            <Input
              id={`${idPrefix}-to`}
              type="date"
              value={params.toDate ?? ''}
              onChange={(e) => onDateChange('toDate', e.target.value)}
              className="flex w-full max-w-full min-w-0 items-center box-border appearance-none h-11 lg:h-10 text-base lg:text-xs [&::-webkit-date-and-time-value]:text-left"
            />
          </div>
        </div>
        {dateRangeError && (
          <p role="alert" className="text-[11px] text-destructive">
            {t('tasks.filter.dateRangeInvalid')}
          </p>
        )}
      </div>

      {/* Phân loại: Cơ sở + Cấp độ */}
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="w-full min-w-0 space-y-1">
          <label htmlFor={`${idPrefix}-site`} className="font-semibold text-muted-foreground">
            {t('tasks.filter.site')}
          </label>
          <Select
            value={params.site ?? 'all'}
            onValueChange={(v) => onPatch({ site: v === 'all' ? undefined : v })}
          >
            <SelectTrigger id={`${idPrefix}-site`} className="w-full max-w-full min-w-0 h-11 lg:h-10 text-xs">
              <SelectValue placeholder={t('tasks.filter.siteAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t('tasks.filter.siteAll')}
              </SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.value} value={site.value} className="text-xs">
                  {getSiteDisplayName(site, i18n.language)}
                </SelectItem>
              ))}
              <SelectItem value={EMPTY_SITE_FILTER} className="text-xs">
                {t('tasks.filter.siteEmpty')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full min-w-0 space-y-1">
          <label htmlFor={`${idPrefix}-level`} className="font-semibold text-muted-foreground">
            {t('tasks.filter.level')}
          </label>
          <Select
            value={params.level ?? 'all'}
            onValueChange={(v) => onPatch({ level: v === 'all' ? undefined : v })}
          >
            <SelectTrigger id={`${idPrefix}-level`} className="w-full max-w-full min-w-0 h-11 lg:h-10 text-xs">
              <SelectValue placeholder={t('tasks.filter.levelAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t('tasks.filter.levelAll')}
              </SelectItem>
              <SelectItem value="critical" className="text-xs">
                {t('tasks.filter.levelCritical')}
              </SelectItem>
              <SelectItem value="urgent" className="text-xs">
                {t('tasks.filter.levelUrgent')}
              </SelectItem>
              <SelectItem value="normal" className="text-xs">
                {t('tasks.filter.levelNormal')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loại nhiệm vụ + Độ mật */}
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="w-full min-w-0 space-y-1">
          <label htmlFor={`${idPrefix}-type`} className="font-semibold text-muted-foreground">
            {t('tasks.filter.taskType')}
          </label>
          <Select
            value={params.taskType ?? 'all'}
            onValueChange={(v) => onPatch({ taskType: v === 'all' ? undefined : v })}
          >
            <SelectTrigger id={`${idPrefix}-type`} className="w-full max-w-full min-w-0 h-11 lg:h-10 text-xs">
              <SelectValue placeholder={t('tasks.filter.taskTypeAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t('tasks.filter.taskTypeAll')}
              </SelectItem>
              {availableTaskTypes.map((tt) => (
                <SelectItem key={tt} value={tt} className="text-xs">
                  {formatBilingualOption(tt, i18n.language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full min-w-0 space-y-1">
          <label htmlFor={`${idPrefix}-conf`} className="font-semibold text-muted-foreground">
            {t('tasks.confidential.label')}
          </label>
          <Select
            value={params.confidential ?? 'all'}
            onValueChange={(v) => onPatch({ confidential: v === 'all' ? undefined : v })}
          >
            <SelectTrigger id={`${idPrefix}-conf`} className="w-full max-w-full min-w-0 h-11 lg:h-10 text-xs">
              <SelectValue placeholder={t('tasks.filter.confidentialAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t('tasks.filter.confidentialAll')}
              </SelectItem>
              <SelectItem value="1" className="text-xs">
                {t('tasks.confidential.lv1')}
              </SelectItem>
              <SelectItem value="2" className="text-xs">
                {t('tasks.confidential.lv2')}
              </SelectItem>
              {canSeeTopSecret && (
                <SelectItem value="3" className="text-xs">
                  {t('tasks.confidential.lv3')}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tính chất đặc thù (chọn nhiều) */}
      <div className="space-y-1.5">
        <span
          id={`${idPrefix}-props-label`}
          className="block font-semibold text-muted-foreground"
        >
          {t('tasks.filter.properties')}
        </span>
        <div
          role="group"
          aria-labelledby={`${idPrefix}-props-label`}
          className="flex flex-wrap gap-1.5"
        >
          {TASK_FLAG_FILTERS.map((flag) => (
            <FlagToggleButton
              key={flag}
              flag={flag}
              active={activeFlags.includes(flag)}
              onToggle={toggleFlag}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
