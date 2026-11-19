import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useDepartments } from '../api/queries'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { TaskStatus } from '@/schemas/task'
import { FILTER_STATUSES, STATUS_META } from '@/components/ui/status-text'
import { cn } from '@/utils'

export interface FilterValues {
  search?: string
  fromDate?: string
  toDate?: string
  department?: string
  status?: string
}

interface FilterBarProps {
  initialValues: FilterValues
  activeFilterCount: number
  onApply: (values: FilterValues) => void
  onReset: () => void
  className?: string
}

const ALL_STATUSES: { key: TaskStatus | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'status.all' },
  ...FILTER_STATUSES.map((status) => ({
    key: status,
    labelKey: STATUS_META[status].labelKey,
  })),
]

export function FilterBar({
  initialValues,
  activeFilterCount,
  onApply,
  onReset,
  className,
}: FilterBarProps) {
  const { t } = useTranslation()
  const { data: departments = [] } = useDepartments()

  // Local draft state initialized from URL props
  const [search, setSearch] = React.useState(initialValues.search || '')
  const [fromDate, setFromDate] = React.useState(initialValues.fromDate || '')
  const [toDate, setToDate] = React.useState(initialValues.toDate || '')
  const [department, setDepartment] = React.useState(initialValues.department || 'all')
  const [status, setStatus] = React.useState(initialValues.status || 'all')
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false)
  const [dateErrorOpen, setDateErrorOpen] = React.useState(false)

  const handleApply = () => {
    // Validate fromDate <= toDate if both provided
    if (fromDate && toDate && fromDate > toDate) {
      setDateErrorOpen(true)
      return
    }

    onApply({
      search: search.trim() || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      department: department !== 'all' ? department : undefined,
      status: status !== 'all' ? status : undefined,
    })
    setMobileSheetOpen(false)
  }

  const handleReset = () => {
    setSearch('')
    setFromDate('')
    setToDate('')
    setDepartment('all')
    setStatus('all')
    onReset()
    setMobileSheetOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApply()
    }
  }

  return (
    <div className={cn('w-full flex flex-col gap-2.5 select-none', className)}>
      {/* ── Desktop Filter Bar (>= lg) ── */}
      <div className="hidden lg:grid grid-cols-[140px_140px_1fr_180px_160px_40px] items-end gap-3">
        {/* Từ ngày */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('tasks.filter.fromDate')}
          </label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 text-xs px-2.5"
          />
        </div>

        {/* Đến ngày */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('tasks.filter.toDate')}
          </label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 text-xs px-2.5"
          />
        </div>

        {/* Ô tìm kiếm */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('common.search')}
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder={t('tasks.filter.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-10 text-xs pl-3 pr-8"
            />
          </div>
        </div>

        {/* Chọn phòng ban */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('common.department')}
          </label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder={t('department.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t('department.all')}
              </SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id} className="text-xs">
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chọn trạng thái */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('common.status')}
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder={t('status.all')} />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((item) => (
                <SelectItem key={item.key} value={item.key} className="text-xs">
                  {t(item.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nút tìm kiếm 40x40px xanh */}
        <Button
          type="button"
          onClick={handleApply}
          className="size-10 p-0 bg-primary hover:bg-primary-hover text-white shrink-0 rounded-lg cursor-pointer"
          title={t('common.apply')}
          aria-label={t('common.apply')}
        >
          <Search className="size-4" />
        </Button>
      </div>

      {/* ── Mobile Filter Row (< lg) ── */}
      <div className="flex lg:hidden items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={t('tasks.filter.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-10 text-xs pl-3 pr-9"
          />
          <button
            type="button"
            onClick={handleApply}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
            aria-label={t('tasks.filter.submitSearch')}
          >
            <Search className="size-4" />
          </button>
        </div>

        {/* Nút mở Bottom Sheet bộ lọc */}
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-10 px-3 text-xs gap-1.5 shrink-0',
                activeFilterCount > 0 && 'border-primary text-primary font-semibold',
              )}
            >
              <Filter className="size-3.5" />
              <span>{t('common.filter')}</span>
              {activeFilterCount > 0 && (
                <span className="size-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-5 space-y-4">
            <SheetHeader className="text-left border-b border-border pb-3">
              <SheetTitle className="text-base font-semibold text-foreground">
                {t('common.filter')}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-3.5 py-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    {t('tasks.filter.fromDate')}
                  </label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    {t('tasks.filter.toDate')}
                  </label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  {t('common.department')}
                </label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder={t('department.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      {t('department.all')}
                    </SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id} className="text-xs">
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  {t('common.status')}
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder={t('status.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map((item) => (
                      <SelectItem key={item.key} value={item.key} className="text-xs">
                        {t(item.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 h-11 text-xs gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                <span>{t('common.reset')}</span>
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1 h-11 text-xs bg-primary hover:bg-primary-hover text-white"
              >
                {t('common.apply')}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active filter summary strip (per brief §5.1: "N bộ lọc đang bật - Xoá hết") */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between py-1 px-2.5 bg-primary-soft/50 rounded-md text-xs text-primary">
          <span>{t('tasks.filter.activeCount', { count: activeFilterCount })}</span>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 font-semibold hover:underline cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>{t('tasks.filter.clearAll')}</span>
          </button>
        </div>
      )}

      <AlertDialog open={dateErrorOpen} onOpenChange={setDateErrorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.filter.dateRangeErrorTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.filter.dateRangeErrorDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDateErrorOpen(false)}>
              {t('common.close')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
