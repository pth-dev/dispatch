import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { getDeptDisplayName } from '@/hooks/use-meta'
import type { DeptItem } from '@/schemas/meta'
import { sameDept } from '@/utils/task-domain'
import { EMPTY_DEPT_KEY, type ExcelScopeType } from '../utils/excel-report-domain'
import type { DirectoryLookupUser } from '../utils/periodic-kpi-domain'

type ExcelScopePickerProps = {
  scopeType: ExcelScopeType
  depts: readonly DeptItem[]
  directory: readonly DirectoryLookupUser[]
  currentUsername: string
  currentDept: string
  selectedDepts: ReadonlySet<string>
  selectedUsers: ReadonlySet<string>
  extraKeyword: string
  onScopeChange: (next: ExcelScopeType) => void
  onToggleDept: (value: string) => void
  onSetUsers: (next: Set<string>) => void
  onExtraKeywordChange: (val: string) => void
}

export function ExcelScopePicker({
  scopeType,
  depts,
  directory,
  currentUsername,
  currentDept,
  selectedDepts,
  selectedUsers,
  extraKeyword,
  onScopeChange,
  onToggleDept,
  onSetUsers,
  onExtraKeywordChange,
}: ExcelScopePickerProps) {
  const { t, i18n } = useTranslation()
  const [personSearch, setPersonSearch] = React.useState('')

  const visiblePeople = directory.filter((u) => {
    const q = personSearch.trim().toLowerCase()
    if (!q) return true
    return (
      u.username.toLowerCase().includes(q) ||
      (u.fullname || '').toLowerCase().includes(q) ||
      (u.dept || '').toLowerCase().includes(q)
    )
  })

  const toggleUser = (username: string) => {
    const key = username.toLowerCase()
    const next = new Set(selectedUsers)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onSetUsers(next)
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">{t('reports.excel.scope')}:</span>
        {(['ALL', 'DEPT', 'PERSON'] as const).map((type) => (
          <Button
            key={type}
            type="button"
            size="sm"
            aria-pressed={scopeType === type}
            variant={scopeType === type ? 'default' : 'outline'}
            className="h-7 px-2.5 text-xs"
            onClick={() => onScopeChange(type)}
          >
            {t(`reports.excel.scopes.${type.toLowerCase()}`)}
          </Button>
        ))}
      </div>

      {scopeType === 'DEPT' && (
        <div className="flex max-h-28 flex-wrap gap-x-4 gap-y-1.5 overflow-y-auto pt-1 text-xs">
          {depts.map((d) => (
            <label key={d.value} className="inline-flex items-center gap-1.5 text-foreground">
              <Checkbox
                checked={selectedDepts.has(d.value)}
                onCheckedChange={() => onToggleDept(d.value)}
              />
              <span>{getDeptDisplayName(d, i18n.language)}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Checkbox
              checked={selectedDepts.has(EMPTY_DEPT_KEY)}
              onCheckedChange={() => onToggleDept(EMPTY_DEPT_KEY)}
            />
            <span>{t('reports.excel.unassignedDept')}</span>
          </label>
        </div>
      )}

      {scopeType === 'PERSON' && (
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Input
              type="search"
              aria-label={t('reports.excel.peoplePicker')}
              placeholder={t('reports.excel.peoplePicker')}
              value={personSearch}
              onChange={(e) => setPersonSearch(e.target.value)}
              className="h-8 w-full sm:w-52 text-xs"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => {
                const next = new Set(selectedUsers)
                for (const u of visiblePeople) next.add(u.username.toLowerCase())
                onSetUsers(next)
              }}
            >
              {t('reports.common.selectAll')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => onSetUsers(new Set())}
            >
              {t('reports.common.clearSelection')}
            </Button>
            {currentDept && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() =>
                  onSetUsers(
                    new Set(
                      directory
                        .filter((u) => sameDept(u.dept, currentDept))
                        .map((u) => u.username.toLowerCase()),
                    ),
                  )
                }
              >
                {t('reports.excel.myDeptBtn')}
              </Button>
            )}
            {currentUsername && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => onSetUsers(new Set([currentUsername.toLowerCase()]))}
              >
                {t('reports.excel.meBtn')}
              </Button>
            )}
            <Input
              type="text"
              aria-label={t('reports.excel.keyword')}
              placeholder={t('reports.excel.keyword')}
              value={extraKeyword}
              onChange={(e) => onExtraKeywordChange(e.target.value)}
              className="h-8 w-full sm:w-44 text-xs"
            />
          </div>

          <div className="flex max-h-24 flex-wrap gap-x-4 gap-y-1 overflow-y-auto text-xs">
            {visiblePeople.slice(0, 80).map((u) => (
              <label key={u.username} className="inline-flex items-center gap-1.5 text-foreground">
                <Checkbox
                  checked={selectedUsers.has(u.username.toLowerCase())}
                  onCheckedChange={() => toggleUser(u.username)}
                />
                <span>
                  {u.username}
                  {u.fullname ? ` / ${u.fullname}` : ''}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
