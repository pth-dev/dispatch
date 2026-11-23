import type { LessonMarqueeHit } from '@/components/ui/lesson-marquee-banner'
import type { SessionUser } from '@/schemas/auth'
import type { RawLesson } from '@/schemas/lesson'
import type { RawTask } from '@/schemas/task'
import { computeAssigneeRanking } from '@/utils/kpi-domain'
import { matchLessonsForTask } from '@/utils/lesson-match'
import { isAssignedToUser, isTaskCompleted } from '@/utils/task-domain'
import {
  computeBottleneckBreakdowns,
  computePeriodFlow,
  computeResponse1hStats,
  computeSnapshotMetrics,
  computeTodayTodoGroups,
  type DashboardPeriod,
  type DashboardScopeMode,
} from '../utils/dashboard-domain'

interface UseDashboardComputationsParams {
  tasks: readonly RawTask[]
  lessons?: readonly RawLesson[]
  scheduledTaskIds?: ReadonlySet<number>
  user: SessionUser | null
  scopeMode: DashboardScopeMode
  period: DashboardPeriod
  includeAllToday?: boolean
  emptyLabel: string
}

const EMPTY_TASK_IDS: ReadonlySet<number> = new Set()

export function useDashboardComputations({
  tasks,
  lessons = [],
  scheduledTaskIds = EMPTY_TASK_IDS,
  user,
  scopeMode,
  period,
  includeAllToday = false,
  emptyLabel,
}: UseDashboardComputationsParams) {
  const myTasks = user
    ? tasks.filter((t) =>
        isAssignedToUser(t, { username: user.username, fullname: user.fullname }),
      )
    : []

  const scopedTasks = scopeMode === 'mine' ? myTasks : tasks
  const snapshot = computeSnapshotMetrics(scopedTasks)
  const periodFlow = computePeriodFlow(scopedTasks, period)
  const response1h = computeResponse1hStats(scopedTasks)
  const todayGroups = computeTodayTodoGroups(tasks, scheduledTaskIds, user, includeAllToday)
  const breakdowns = computeBottleneckBreakdowns(scopedTasks, emptyLabel)
  const ranking = computeAssigneeRanking(tasks)
  const myPendingTasks = myTasks.filter((t) => !isTaskCompleted(t))

  const lessonHitMap = new Map<number, LessonMarqueeHit>()
  for (const task of tasks) {
    if (isTaskCompleted(task)) continue
    for (const hit of matchLessonsForTask(task, lessons)) {
      if (!lessonHitMap.has(hit.id)) {
        lessonHitMap.set(hit.id, hit)
      }
    }
  }

  return {
    snapshot,
    periodFlow,
    response1h,
    todayGroups,
    breakdowns,
    ranking,
    myPendingTasks,
    lessonHits: Array.from(lessonHitMap.values()),
  }
}
