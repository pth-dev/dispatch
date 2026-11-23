import * as React from 'react'
import { ArrowDown, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { InlineError, PageContainer, PageContainerBody, PageHeader } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/utils/cn'
import { KpiBriefDonutCard } from '../components/KpiBriefDonutCard'
import { KpiBriefFinishedModal } from '../components/KpiBriefFinishedModal'
import { KpiBriefFinishedSection } from '../components/KpiBriefFinishedSection'
import { KpiBriefHeaderActions } from '../components/KpiBriefHeaderActions'
import { KpiBriefPeopleTable } from '../components/KpiBriefPeopleTable'
import { KpiBriefPeriodBar } from '../components/KpiBriefPeriodBar'
import { KpiBriefSummaryCards } from '../components/KpiBriefSummaryCards'
import { KpiBriefUnfinishedSection } from '../components/KpiBriefUnfinishedSection'
import { useKpiBriefBoard } from '../hooks/use-kpi-brief-board'
import type { BriefStatus } from '../utils/kpi-brief-domain'

export default function KpiBriefPage() {
  const { t } = useTranslation()
  const board = useKpiBriefBoard()
  const unfinishedRef = React.useRef<HTMLDivElement>(null)
  const finishedRef = React.useRef<HTMLDivElement>(null)

  function scrollToRef(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleSelectUnfinishedStatus(status: BriefStatus) {
    board.setStatusFilter((prev) => {
      const next = prev === status ? '' : status
      if (next) {
        requestAnimationFrame(() => scrollToRef(unfinishedRef))
      }
      return next
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('kpiBrief.title')}
        subtitle={t('kpiBrief.subtitle')}
        actions={
          <KpiBriefHeaderActions
            user={board.user}
            view={board.view}
            viewOptions={board.viewOptions}
            isFetching={board.tasksQuery.isFetching}
            onViewChange={board.handleViewChange}
            onCopyTsv={() => void board.handleCopyTsv()}
            onExportPeopleCsv={board.handleExportPeopleCsv}
            onExportUnfinishedCsv={board.handleExportUnfinishedCsv}
            onRefresh={() => void board.handleRefresh()}
          />
        }
      />

      <PageContainerBody className="space-y-4">
        {board.notice && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              'rounded-lg border px-3.5 py-2 text-xs font-medium',
              board.notice.tone === 'error'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-success/30 bg-success/10 text-success',
            )}
          >
            {board.notice.message}
          </div>
        )}

        <KpiBriefPeriodBar
          year={board.year}
          month={board.month}
          personKey={board.effectivePersonKey}
          meKey={board.meKey}
          years={board.years}
          monthCounts={board.monthCounts}
          people={board.peopleByName}
          allAggregate={board.allViewAgg}
          syncedLabel={board.syncedLabel}
          onYearChange={board.handleYearChange}
          onMonthChange={board.handleMonthChange}
          onPersonChange={board.handleTogglePerson}
        />

        {board.tasksQuery.isError ? (
          <InlineError status="500" onRetry={() => void board.tasksQuery.refetch()} />
        ) : board.tasksQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <KpiBriefSummaryCards aggregate={board.boardAgg} scopeSubtitle={board.scopeSubtitle} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(300px,1fr)_2.4fr]">
              <KpiBriefDonutCard
                aggregate={board.boardAgg}
                activeStatus={board.statusFilter}
                onSelectUnfinishedStatus={handleSelectUnfinishedStatus}
              />
              <KpiBriefPeopleTable
                people={board.peopleByRate}
                selectedPersonKey={board.effectivePersonKey}
                meKey={board.meKey}
                resolveDeptLabel={board.resolveDeptLabel}
                onSelectPerson={board.handleTogglePerson}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-3 py-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => scrollToRef(unfinishedRef)}
                className="rounded-full"
              >
                <ArrowDown className="size-4" aria-hidden="true" />
                {t('kpiBrief.actions.jumpUnfinished')}
                <Badge variant="secondary" className="ml-1 tabular-nums">
                  {board.unfinishedCases.length}
                </Badge>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => scrollToRef(finishedRef)}
                className="rounded-full"
              >
                <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                {t('kpiBrief.actions.jumpFinished')}
                <Badge variant="secondary" className="ml-1 tabular-nums">
                  {board.finishedCounts.total}
                </Badge>
              </Button>
            </div>

            <KpiBriefUnfinishedSection
              sectionRef={unfinishedRef}
              cases={board.unfinishedCases}
              monthLabel={board.monthLabel}
              hasMonthFilter={board.month !== 0}
              personName={board.selectedPersonName}
              statusFilter={board.statusFilter}
              resolveDeptLabel={board.resolveDeptLabel}
              onClearMonth={() => board.handleMonthChange(0)}
              onClearPerson={() => board.handleTogglePerson('')}
              onClearStatus={() => board.setStatusFilter('')}
            />

            <KpiBriefFinishedSection
              sectionRef={finishedRef}
              cases={board.finishedCases}
              totalCount={board.finishedCounts.total}
              ontimeCount={board.finishedCounts.ontime}
              lateCount={board.finishedCounts.late}
              finFilter={board.finFilter}
              resolveDeptLabel={board.resolveDeptLabel}
              onFinFilterChange={board.setFinFilter}
              onOpenFinishedDetail={board.setSelectedFinished}
            />

            <KpiBriefFinishedModal
              item={board.selectedFinished}
              directory={board.directory}
              resolveDeptLabel={board.resolveDeptLabel}
              onClose={() => board.setSelectedFinished(null)}
            />
          </>
        )}
      </PageContainerBody>
    </PageContainer>
  )
}
