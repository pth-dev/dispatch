import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import {
  InlineError,
  PageContainer,
  PageContainerBody,
  PageHeader,
} from '@/components/layout'
import { APP_ROUTES } from '@/constants/app-routes'
import { TaskCreateModeBar } from '../components/editor/TaskCreateModeBar'
import { TaskEditorForm } from '../components/editor/TaskEditorForm'
import { TaskHistoryCloneDialog } from '../components/editor/TaskHistoryCloneDialog'
import { useTaskCreatePage } from '../hooks/use-task-create-page'

export function TaskCreatePage() {
  const { t } = useTranslation()
  const {
    mode,
    sourceId,
    sourceTask,
    loadingSource,
    hasSourceError,
    errorStatus,
    initialVariant,
    variant,
    setVariant,
    activeModeVariant,
    showDailyRepair,
    pageTitle,
    historyOpen,
    setHistoryOpen,
    enterQuickModeRef,
    handleSelectFull,
    handleSelectQuick,
    handleSelectDailyRepair,
    handlePickHistoricalTask,
    handleRetry,
  } = useTaskCreatePage()

  return (
    <PageContainer>
      <div className="shrink-0 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
          <Link
            to={APP_ROUTES.TASKS}
            className="flex items-center gap-1 hover:text-foreground font-medium"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>{t('tasks.detail.backToList')}</span>
          </Link>
          <span aria-hidden="true">›</span>
          <span className="font-semibold text-foreground">{pageTitle}</span>
        </div>

        <PageHeader
          title={pageTitle}
          actions={
            mode !== 'edit' ? (
              <TaskCreateModeBar
                activeVariant={activeModeVariant}
                showDailyRepair={showDailyRepair}
                onSelectFull={handleSelectFull}
                onSelectQuick={handleSelectQuick}
                onOpenHistoryPicker={() => setHistoryOpen(true)}
                onSelectDailyRepair={handleSelectDailyRepair}
              />
            ) : undefined
          }
        />
      </div>

      <PageContainerBody>
        {sourceId > 0 && loadingSource ? (
          <div role="status" className="space-y-4 animate-pulse">
            <span className="sr-only">{t('common.loading')}</span>
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 xl:col-span-8 h-80 rounded-xl bg-muted" />
              <div className="lg:col-span-5 xl:col-span-4 h-80 rounded-xl bg-muted" />
            </div>
          </div>
        ) : sourceId > 0 && hasSourceError ? (
          <InlineError status={errorStatus} onRetry={handleRetry} />
        ) : (
          <TaskEditorForm
            key={`${mode}-${sourceTask?.id ?? initialVariant}`}
            mode={mode}
            sourceTask={sourceTask}
            initialVariant={initialVariant}
            variant={variant}
            onVariantChange={setVariant}
            enterQuickModeRef={enterQuickModeRef}
          />
        )}
      </PageContainerBody>

      {mode !== 'edit' && (
        <TaskHistoryCloneDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          onPickTask={handlePickHistoricalTask}
        />
      )}
    </PageContainer>
  )
}

export default TaskCreatePage
