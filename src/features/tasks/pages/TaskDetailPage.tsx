import * as React from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  Building,
  Calendar,
  Paperclip,
  Share2,
  Edit,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusText } from '@/components/ui/status-text'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ReassignDialog } from '../components/ReassignDialog'
import { useTask, useReassignTask } from '../api/queries'
import { InlineError, isFullPageError, throwFullPageError, toErrorStatus } from '@/components/layout'
import { APP_ROUTES } from '@/constants/app-routes'
import type { TaskReassignFormValues } from '@/schemas/task'

function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return dateStr
  return `${day}/${month}/${year}`
}

export function TaskDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: task, isLoading, isError, error, refetch } = useTask(id)
  const reassignMutation = useReassignTask()

  const [reassignOpen, setReassignOpen] = React.useState(false)
  const [newComment, setNewComment] = React.useState('')
  const [addedComments, setAddedComments] = React.useState<
    { id: string; author: string; time: string; content: string }[]
  >([])

  // Pure derived state combining server comments and user-added comments
  const allComments = [...(task?.comments || []), ...addedComments]

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-48" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  if (isError) {
    const errorStatus = toErrorStatus(error)

    if (isFullPageError(errorStatus)) {
      throwFullPageError(errorStatus)
    }

    return <InlineError status={errorStatus} onRetry={() => void refetch()} />
  }

  if (!task) {
    throwFullPageError('404')
  }

  const handleReassignConfirm = (values: TaskReassignFormValues) => {
    reassignMutation.mutate(
      { id: task.id, data: values },
      {
        onSuccess: () => {
          setReassignOpen(false)
        },
      },
    )
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setAddedComments((prev) => [
      ...prev,
      {
        id: `cm_${Date.now()}`,
        author: 'Nguyễn An',
        time: new Date().toLocaleString('vi-VN'),
        content: newComment.trim(),
      },
    ])
    setNewComment('')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4">
      {/* ── Breadcrumbs ── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
        <Link
          to={APP_ROUTES.TASKS}
          className="flex items-center gap-1 hover:text-foreground font-medium"
        >
          <ArrowLeft className="size-3.5" />
          <span>{t('tasks.detail.backToList')}</span>
        </Link>
        <span>›</span>
        <span className="font-semibold text-primary">{task.id}</span>
      </div>

      {/* ── Header Card ── */}
      <div className="bg-card rounded-xl border border-border p-4 lg:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-primary-soft text-primary font-bold px-2 py-0.5 rounded text-xs">
                {task.id}
              </span>
              <h1 className="text-lg lg:text-xl font-semibold text-foreground">
                {task.title}
              </h1>
            </div>

            {/* Status row */}
            <div className="flex items-center gap-3 pt-1 text-xs">
              <StatusText status={task.status} />
              {task.urgent && (
                <span className="inline-flex items-center gap-1 text-destructive font-semibold text-xs">
                  <span className="size-1.5 rounded-full bg-destructive" />
                  {t('status.urgent')}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-11 lg:h-9 gap-1.5 text-xs"
              onClick={() => navigate(APP_ROUTES.TASK_NEW)}
            >
              <Edit className="size-3.5" />
              <span>{t('tasks.detail.edit')}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-11 lg:h-9 gap-1.5 text-xs"
              onClick={() => setReassignOpen(true)}
            >
              <Share2 className="size-3.5" />
              <span>{t('tasks.detail.reassign')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tabs Content ── */}
      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList className="bg-card border border-border p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-xs">
            {t('tasks.detail.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">
            {t('tasks.detail.tabs.timeline')}
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-xs">
            {t('tasks.detail.tabs.comments')} ({allComments.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 cols: Description & Checklist */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('tasks.detail.description')}
                </h3>
                <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                  {task.description || t('tasks.detail.noDescription')}
                </p>
              </div>

              {/* Checklist */}
              {task.checklist && task.checklist.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('tasks.detail.checklistTitle', {
                      done: task.checklist.filter((c) => c.completed).length,
                      total: task.checklist.length,
                    })}
                  </h3>
                  <div className="space-y-2">
                    {task.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2.5 text-xs">
                        <CheckCircle2
                          className={item.completed ? 'size-4 text-status-done shrink-0' : 'size-4 text-muted shrink-0'}
                        />
                        <span className={item.completed ? 'text-foreground line-through opacity-75' : 'text-foreground'}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right col: Info & Progress Cards */}
            <div className="space-y-4">
              {/* Progress & SLA */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('tasks.detail.progressAndSla')}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('tasks.detail.progressLabel')}</span>
                    <span className="font-semibold text-primary">{task.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Task Meta Info */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-3 text-xs">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('tasks.detail.info')}
                </h3>
                <div className="space-y-2.5 divide-y divide-border/60">
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="size-3.5" />
                      {t('common.assignee')}:
                    </span>
                    <span className="font-medium text-foreground">{task.assignee}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Building className="size-3.5" />
                      {t('common.department')}:
                    </span>
                    <span className="font-medium text-foreground">
                      {task.departmentName || task.department}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="size-3.5" />
                      {t('common.dueDate')}:
                    </span>
                    <span className="font-medium text-foreground">
                      {formatDateVN(task.dueDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" />
                      {t('tasks.detail.creator')}:
                    </span>
                    <span className="font-medium text-foreground">{task.createdBy}</span>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-2 text-xs">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('tasks.detail.attachments')}
                </h3>
                {task.attachments && task.attachments.length > 0 ? (
                  <div className="space-y-1.5">
                    {task.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="size-3.5 text-primary shrink-0" />
                          <span className="truncate font-medium">{att.name}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 pl-2">
                          {att.size}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs italic">
                    {t('tasks.detail.noAttachments')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Timeline */}
        <TabsContent value="timeline" className="outline-none">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t('tasks.detail.tabs.timeline')}
            </h3>
            {task.timeline && task.timeline.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {task.timeline.map((event) => (
                  <div key={event.id} className="relative space-y-1 text-xs">
                    <span className="absolute -left-6 top-1 size-2.5 rounded-full bg-primary ring-4 ring-card" />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{event.action}</span>
                      <span className="text-muted-foreground text-[11px]">• {event.time}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {t('tasks.detail.timelineBy', { actor: event.actor })}
                    </p>
                    {event.note && (
                      <p className="p-2 rounded bg-muted text-foreground/90 font-mono text-[11px]">
                        {event.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t('tasks.detail.noTimeline')}</p>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Comments */}
        <TabsContent value="comments" className="outline-none">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t('tasks.detail.tabs.comments')}
            </h3>

            {/* Comment List */}
            <div className="space-y-3">
              {allComments.map((cm) => (
                <div key={cm.id} className="p-3 rounded-lg bg-muted/40 border border-border space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">{cm.author}</span>
                    <span className="text-[11px] text-muted-foreground">{cm.time}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{cm.content}</p>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="space-y-2 pt-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('tasks.detail.commentPlaceholder')}
                rows={3}
                className="text-xs"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5 text-xs bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  <Send className="size-3.5" />
                  <span>{t('tasks.detail.sendComment')}</span>
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reassign Dialog */}
      <ReassignDialog
        task={task}
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        onConfirm={handleReassignConfirm}
        isSubmitting={reassignMutation.isPending}
      />
    </div>
  )
}
export default TaskDetailPage
