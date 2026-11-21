import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import {
  InlineError,
  PageContainer,
  PageContainerBody,
  isFullPageError,
  throwFullPageError,
  toErrorStatus,
} from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useAllTasks } from '@/hooks/use-tasks'
import type { LessonFormValues } from '@/schemas/lesson'
import type { RawAttachment } from '@/schemas/task'
import { canEditLesson, canWriteMenu } from '@/utils/permissions'
import { useLessons } from '../api/queries'
import { LessonDetailPanel } from '../components/LessonDetailPanel'
import { LessonEditorPanel } from '../components/LessonEditorPanel'
import { LessonImageLightbox, type LightboxImage } from '../components/LessonImageLightbox'
import { LessonListPanel } from '../components/LessonListPanel'
import { useLessonActions } from '../hooks/use-lesson-actions'
import { useLessonState } from '../hooks/use-lesson-state'
import {
  buildLessonHitIndex,
  filterLessons,
} from '../utils/lesson-domain'

export function LessonsPage() {
  const { t } = useTranslation()
  const user = useAppStore((s) => s.user)
  const canWrite = canWriteMenu(user, 'learnknow')

  const {
    data: lessons = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useLessons()
  const { data: allTasks = [], refetch: refetchTasks } = useAllTasks()

  const {
    selectedId,
    panelMode,
    filter,
    search,
    hasActiveFilters,
    selectLesson,
    openCreate,
    openEdit,
    closeEditor,
    clearSelection,
    setFilter,
    setSearch,
    resetFilters,
  } = useLessonState()

  const {
    isSaving,
    isDeleting,
    actionError,
    clearActionError,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useLessonActions()

  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null)

  const errorStatus = toErrorStatus(error)
  if (isError && isFullPageError(errorStatus)) {
    throwFullPageError(errorStatus)
  }

  const { hitsById, hitCountById, openHitCountById } = buildLessonHitIndex(lessons, allTasks)

  const visibleLessons = filterLessons(
    lessons,
    hitCountById,
    filter,
    search,
    user?.username,
  )

  const selectedLesson =
    selectedId > 0 ? lessons.find((item) => item.id === selectedId) ?? null : null
  const selectedMatchedTasks = selectedLesson ? hitsById.get(selectedLesson.id) ?? [] : []

  const canEditSelected = canEditLesson(user, selectedLesson)
  const effectiveMode =
    panelMode === 'edit' && (!selectedLesson || !canEditSelected)
      ? selectedLesson
        ? 'view'
        : 'empty'
      : panelMode === 'create' && !canWrite
        ? selectedLesson
          ? 'view'
          : 'empty'
        : panelMode

  const isRightPanelActiveOnMobile = effectiveMode !== 'empty'

  const handleRefresh = () => {
    void refetch()
    void refetchTasks()
  }

  const handleEditorSubmit = async (payload: {
    values: LessonFormValues
    retainedImages: RawAttachment[]
    stagedFiles: File[]
  }) => {
    if (effectiveMode === 'edit' && selectedLesson) {
      const ok = await handleUpdate({
        id: selectedLesson.id,
        topic: payload.values.topic,
        keywords: payload.values.keywords,
        content: payload.values.content,
        retainedImages: payload.retainedImages,
        files: payload.stagedFiles,
      })
      if (ok) {
        closeEditor(selectedLesson.id)
      }
      return
    }

    const createdId = await handleCreate({
      topic: payload.values.topic,
      keywords: payload.values.keywords,
      content: payload.values.content,
      files: payload.stagedFiles,
    })
    if (createdId !== null) {
      if (createdId > 0) {
        selectLesson(createdId)
      } else {
        clearSelection()
      }
    }
  }

  const handleDeleteSelected = async (id: number) => {
    const ok = await handleDelete(id)
    if (ok) {
      clearSelection()
    }
  }

  return (
    <PageContainer>
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-foreground lg:text-2xl">
              {t('nav.lessons')}
            </h1>
            {!isLoading && !isError && (
              <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-primary">
                {lessons.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t('lessons.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isFetching}
            onClick={handleRefresh}
          >
            <RefreshCw
              className={isFetching ? 'size-4 motion-safe:animate-spin' : 'size-4'}
              aria-hidden="true"
            />
            <span>{t('common.refresh')}</span>
          </Button>

          {canWrite && (
            <Button
              type="button"
              onClick={() => {
                clearActionError()
                openCreate()
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{t('lessons.actions.create')}</span>
            </Button>
          )}
        </div>
      </div>

      {isError ? (
        <InlineError status={errorStatus} onRetry={() => void refetch()} />
      ) : (
        <PageContainerBody surface="transparent">
          <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-1">
            <div
              className={
                isRightPanelActiveOnMobile
                  ? 'hidden lg:col-span-5 lg:flex lg:min-h-0 lg:flex-col'
                  : 'lg:col-span-5 lg:flex lg:min-h-0 lg:flex-col'
              }
            >
              <LessonListPanel
                lessons={visibleLessons}
                totalCount={lessons.length}
                isLoading={isLoading}
                selectedId={selectedId}
                isCreating={effectiveMode === 'create'}
                filter={filter}
                search={search}
                hasActiveFilters={hasActiveFilters}
                canWrite={canWrite}
                hitCountById={hitCountById}
                openHitCountById={openHitCountById}
                onSelect={(id) => {
                  clearActionError()
                  selectLesson(id)
                }}
                onFilterChange={setFilter}
                onSearchChange={setSearch}
                onResetFilters={resetFilters}
                onCreate={() => {
                  clearActionError()
                  openCreate()
                }}
              />
            </div>

            <div
              className={
                isRightPanelActiveOnMobile
                  ? 'lg:col-span-7 lg:min-h-0 lg:overflow-y-auto lg:scrollbar-gutter-stable'
                  : 'hidden lg:col-span-7 lg:block lg:min-h-0 lg:overflow-y-auto lg:scrollbar-gutter-stable'
              }
            >
              {effectiveMode === 'create' || effectiveMode === 'edit' ? (
                <LessonEditorPanel
                  key={`${effectiveMode}-${selectedLesson?.id ?? 'new'}`}
                  mode={effectiveMode}
                  lesson={effectiveMode === 'edit' ? selectedLesson : null}
                  allTasks={allTasks}
                  isSaving={isSaving}
                  actionError={actionError}
                  onSubmit={handleEditorSubmit}
                  onCancel={() => {
                    clearActionError()
                    closeEditor()
                  }}
                  onOpenImage={setLightboxImage}
                />
              ) : (
                <LessonDetailPanel
                  lesson={selectedLesson}
                  matchedTasks={selectedMatchedTasks}
                  canEdit={canEditSelected}
                  isDeleting={isDeleting}
                  actionError={actionError}
                  onEdit={(id) => {
                    clearActionError()
                    openEdit(id)
                  }}
                  onDelete={handleDeleteSelected}
                  onOpenImage={setLightboxImage}
                  onBackToList={clearSelection}
                />
              )}
            </div>
          </div>
        </PageContainerBody>
      )}

      <LessonImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </PageContainer>
  )
}

export default LessonsPage
