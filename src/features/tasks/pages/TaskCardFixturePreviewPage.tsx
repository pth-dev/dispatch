import { useTranslation } from 'react-i18next'
import { TaskCard } from '../components/TaskCard'
import { TaskCardSkeleton } from '../components/TaskCardSkeleton'
import { createTaskCardFixtures } from '../utils/task-card-fixtures'
import { mapTaskToCardViewModel } from '../utils/task-card-mapper'

const PREVIEW_DEPT_NAMES: Record<string, string> = {
  資訊部: 'BP. Công nghệ thông tin',
  製造部: 'BP. Sản xuất',
  總務部: 'BP. Hành chính tổng hợp',
  品管部: 'BP. Quản lý chất lượng',
  財務部: 'BP. Tài chính kế toán',
}

const PREVIEW_SITE_NAMES: Record<string, string> = {
  VT: 'Vĩnh Thịnh',
  YS: 'Yên Sơn',
}

const PREVIEW_RESOLVERS = {
  resolveDeptName: (raw: string | null | undefined) =>
    (raw && PREVIEW_DEPT_NAMES[raw]) || raw || '-',
  resolveSiteName: (code: string) => PREVIEW_SITE_NAMES[code] || code,
}

export function TaskCardFixturePreviewPage() {
  const { t } = useTranslation()
  const fixtures = createTaskCardFixtures()

  return (
    <main className="min-h-dvh bg-background px-4 py-4 lg:px-6 space-y-3">
      <h1 className="text-xl lg:text-2xl font-semibold text-foreground">
        {t('tasks.title')}
      </h1>

      <div
        data-testid="fixture-card-grid"
        className="grid grid-cols-task-cards auto-rows-fr gap-4"
      >
        {fixtures.map((task) => (
          <TaskCard
            key={task.id}
            vm={mapTaskToCardViewModel(task, PREVIEW_RESOLVERS)}
          />
        ))}
        <TaskCardSkeleton />
      </div>
    </main>
  )
}

export default TaskCardFixturePreviewPage
