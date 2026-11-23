import type { LessonMarqueeHit } from '@/components/ui/lesson-marquee-banner'
import type { SessionUser } from '@/schemas/auth'
import type { RawLesson } from '@/schemas/lesson'
import type { RawTask } from '@/schemas/task'
import { matchLessonsForTask } from '@/utils/lesson-match'
import { isAssignedToUser, isTaskCompleted } from '@/utils/task-domain'
import {
  computeCreatedVsResolvedSeries,
  computeDeptPeopleStatusMatrix,
  computeOverdueAgingStats,
  computePeriodAssigneeRanking,
  computePeriodFlowComparison,
  type FlowTrendGranularity,
} from '../utils/dashboard-charts'
import {
  computeBottleneckBreakdowns,
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
  flowTrendGran?: FlowTrendGranularity
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
  flowTrendGran = 'week',
  includeAllToday = false,
  emptyLabel,
}: UseDashboardComputationsParams) {
  const myTasks = user
    ? tasks.filter((t) =>
        isAssignedToUser(t, { username: user.username, fullname: user.fullname }),
      )
    : []

  const scopedTasks = scopeMode === 'mine' ? myTasks : tasks
  const now = new Date()
  const snapshot = computeSnapshotMetrics(scopedTasks, now)
  const periodComparison = computePeriodFlowComparison(scopedTasks, period, now)
  const periodFlow = periodComparison.current
  const response1h = computeResponse1hStats(scopedTasks, now, period)
  const flowTrend = computeCreatedVsResolvedSeries(scopedTasks, flowTrendGran, now)
  const overdueAging = computeOverdueAgingStats(scopedTasks, now)
  const todayGroups = computeTodayTodoGroups(tasks, scheduledTaskIds, user, includeAllToday, now)
  const breakdowns = computeBottleneckBreakdowns(scopedTasks, emptyLabel, now)
  const ranking = computePeriodAssigneeRanking(tasks, period, now)
  const memberStatusMatrix = computeDeptPeopleStatusMatrix(tasks, now)
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
    periodComparison,
    response1h,
    flowTrend,
    overdueAging,
    todayGroups,
    breakdowns,
    ranking,
    memberStatusMatrix,
    myPendingTasks,
    lessonHits: Array.from(lessonHitMap.values()),
  }
}
