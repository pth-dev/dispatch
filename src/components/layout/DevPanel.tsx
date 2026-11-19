import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Settings2, X, RefreshCw, Shield, Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore, type UserRole, type SessionState } from '@/app/store'

export function DevPanel() {
  if (!import.meta.env.DEV) {
    return null
  }

  return <DevPanelContent />
}

function DevPanelContent() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)
  const { user, density, mockScenario, setRole, setDensity, setMockScenario } =
    useAppStore()

  const scenarios: { key: SessionState['mockScenario']; labelKey: string }[] = [
    { key: 'normal', labelKey: 'devPanel.scenarios.normal' },
    { key: 'slow', labelKey: 'devPanel.scenarios.slow' },
    { key: 'empty', labelKey: 'devPanel.scenarios.empty' },
    { key: '401', labelKey: 'devPanel.scenarios.401' },
    { key: '403', labelKey: 'devPanel.scenarios.403' },
    { key: '404', labelKey: 'devPanel.scenarios.404' },
    { key: '500', labelKey: 'devPanel.scenarios.500' },
    { key: 'offline', labelKey: 'devPanel.scenarios.offline' },
  ]

  const roles: UserRole[] = ['employee', 'approver', 'manager', 'admin']

  return (
    <aside aria-label={t('devPanel.ariaLabel')}>
      {/* Floating Collapsed Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex size-10 items-center justify-center rounded-full bg-[#1F2937] text-white shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer select-none"
          title={t('devPanel.open')}
          aria-label={t('devPanel.open')}
        >
          <Settings2 className="size-5 animate-spin-slow" />
        </button>
      )}

      {/* Expanded Dev Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-border bg-card p-4 shadow-xl select-none text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Sliders className="size-4 text-primary" />
              <span>{t('devPanel.title')}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label={t('devPanel.close')}
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Active Role Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-muted-foreground font-semibold">
              <Shield className="size-3.5" />
              <span>{t('devPanel.roleLabel')}</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {roles.map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={user.role === r ? 'default' : 'outline'}
                  onClick={() => setRole(r)}
                  className="h-7 text-[11px] justify-start px-2 font-normal truncate"
                >
                  {t(`role.${r}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Table Density */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-semibold">
              {t('devPanel.densityLabel')}
            </label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={density === 'compact' ? 'default' : 'outline'}
                onClick={() => setDensity('compact')}
                className="h-7 flex-1 text-[11px]"
              >
                {t('devPanel.compact')}
              </Button>
              <Button
                size="sm"
                variant={density === 'comfortable' ? 'default' : 'outline'}
                onClick={() => setDensity('comfortable')}
                className="h-7 flex-1 text-[11px]"
              >
                {t('devPanel.comfortable')}
              </Button>
            </div>
          </div>

          {/* Mock Scenario */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-muted-foreground font-semibold">
              <RefreshCw className="size-3.5" />
              <span>{t('devPanel.scenarioLabel')}</span>
            </label>
            <select
              value={mockScenario}
              onChange={(e) =>
                setMockScenario(e.target.value as SessionState['mockScenario'])
              }
              className="w-full h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-primary"
            >
              {scenarios.map((s) => (
                <option key={s.key} value={s.key}>
                  {t(s.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-1 text-[10px] text-muted-foreground text-center">
            {t('devPanel.devOnlyNote')}
          </div>
        </div>
      )}
    </aside>
  )
}
