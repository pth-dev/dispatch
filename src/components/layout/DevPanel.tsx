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

  const scenarios: { key: SessionState['mockScenario']; label: string }[] = [
    { key: 'normal', label: 'Bình thường (Normal 200ms)' },
    { key: 'slow', label: 'Chậm (Slow 1500ms)' },
    { key: 'empty', label: 'Dữ liệu rỗng (Empty)' },
    { key: '401', label: 'Lỗi 401 Hết hạn phiên' },
    { key: '403', label: 'Lỗi 403 Cấm truy cập' },
    { key: '404', label: 'Lỗi 404 Không tìm thấy' },
    { key: '500', label: 'Lỗi 500 Máy chủ' },
    { key: 'offline', label: 'Mất kết nối mạng' },
  ]

  const roles: UserRole[] = ['employee', 'approver', 'manager', 'admin']

  return (
    <aside aria-label="Bảng công cụ lập trình viên (DEV Panel)">
      {/* Floating Collapsed Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex size-10 items-center justify-center rounded-full bg-[#1F2937] text-white shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer select-none"
          title="Bật công cụ mô phỏng DEV"
          aria-label="Open DEV Simulation Panel"
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
              <span>DEV Simulation Tools</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Close DEV Panel"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Active Role Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-muted-foreground font-semibold">
              <Shield className="size-3.5" />
              <span>Vai trò người dùng:</span>
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
              Mật độ hiển thị bảng (Table Density):
            </label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={density === 'compact' ? 'default' : 'outline'}
                onClick={() => setDensity('compact')}
                className="h-7 flex-1 text-[11px]"
              >
                Compact (44px)
              </Button>
              <Button
                size="sm"
                variant={density === 'comfortable' ? 'default' : 'outline'}
                onClick={() => setDensity('comfortable')}
                className="h-7 flex-1 text-[11px]"
              >
                Comfortable (50px)
              </Button>
            </div>
          </div>

          {/* Mock Scenario */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-muted-foreground font-semibold">
              <RefreshCw className="size-3.5" />
              <span>Kịch bản Mock MSW / API:</span>
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
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-1 text-[10px] text-muted-foreground text-center">
            Chỉ hiển thị trong môi trường DEV (import.meta.env.DEV)
          </div>
        </div>
      )}
    </aside>
  )
}
