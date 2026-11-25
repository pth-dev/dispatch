import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  TaskReportFormSchema,
  type RawReport,
  type RawTask,
  type SplitMember,
  type TaskReportFormValues,
  type WorkItemsEnvelope,
} from '@/schemas/task'
import type { SessionUser } from '@/schemas/auth'
import { isAssignedToUser, isTaskPaused } from '@/utils/task-domain'
import { resolveApiErrorMessage } from '@/services'
import { useGenerateAiReport, useSubmitReport } from '../api/queries'
import {
  calcWeightedTotalProgress,
  computeWorkItemReportStats,
  isWorkItemMine,
} from '../utils/work-items-domain'
import type { TopicDraftState } from '../components/ReportWorkTopicsPicker'

type UseReportComposerOptions = {
  task: RawTask
  user: SessionUser
  splitMembers: SplitMember[]
  workItems: WorkItemsEnvelope | null
  reports: RawReport[]
  selectTopicRef?: React.RefObject<((topicId: string) => void) | null>
}

function buildInitialDrafts(
  workItems: WorkItemsEnvelope | null,
  reportStats: ReturnType<typeof computeWorkItemReportStats>,
): Record<string, TopicDraftState> {
  const out: Record<string, TopicDraftState> = {}
  if (!workItems) return out
  for (const item of workItems.items) {
    const prev = reportStats[item.id]?.topicProgress
    out[item.id] = {
      checked: false,
      progress: prev !== null && prev !== undefined ? String(prev) : '',
      early: false,
    }
  }
  return out
}

export function useReportComposer({
  task,
  user,
  splitMembers,
  workItems,
  reports,
  selectTopicRef,
}: UseReportComposerOptions) {
  const { t, i18n } = useTranslation()
  const submitReport = useSubmitReport()
  const generateAi = useGenerateAiReport()

  const reportStats = computeWorkItemReportStats(reports)
  const [files, setFiles] = React.useState<File[]>([])
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const [calcHint, setCalcHint] = React.useState<string | null>(null)
  const [topicDrafts, setTopicDrafts] = React.useState<Record<string, TopicDraftState>>(() =>
    buildInitialDrafts(workItems, reportStats),
  )

  React.useEffect(() => {
    if (!selectTopicRef) return
    selectTopicRef.current = (topicId: string) => {
      setTopicDrafts((prev) => {
        const statProg = reportStats[topicId]?.topicProgress
        const existing = prev[topicId] ?? {
          checked: false,
          progress: statProg !== null && statProg !== undefined ? String(statProg) : '',
          early: false,
        }
        return {
          ...prev,
          [topicId]: { ...existing, checked: true },
        }
      })
    }
    return () => {
      selectTopicRef.current = null
    }
  }, [selectTopicRef, reportStats])

  const selfSplitMember = splitMembers.find((m) =>
    isAssignedToUser({ assign_person: m.assignee }, user),
  )
  const defaultTargetId = selfSplitMember?.id ?? task.id

  const form = useForm<TaskReportFormValues>({
    resolver: zodResolver(TaskReportFormSchema),
    defaultValues: {
      content: '',
      progress: task.progress,
      km_link: '',
      status: isTaskPaused(task) ? 'paused' : 'running',
      pause_reason: task.pause_reason ?? '',
      target_id: defaultTargetId,
    },
  })

  const currentStatus = useWatch({ control: form.control, name: 'status' })
  const currentProgress = useWatch({ control: form.control, name: 'progress' })

  const handleStatusChange = (nextStatus: 'running' | 'paused') => {
    form.setValue('status', nextStatus)
    if (nextStatus === 'paused' && Number(currentProgress) === 100) {
      form.setValue('progress', 99)
    }
  }

  const handleTopicToggle = (id: string, checked: boolean) => {
    setTopicDrafts((prev) => {
      const cur = prev[id] ?? { checked: false, progress: '', early: false }
      return { ...prev, [id]: { ...cur, checked, early: checked ? cur.early : false } }
    })
  }

  const handleTopicProgressChange = (id: string, value: string) => {
    setTopicDrafts((prev) => {
      const cur = prev[id] ?? { checked: true, progress: '', early: false }
      return { ...prev, [id]: { ...cur, progress: value } }
    })
  }

  const handleTopicEarlyChange = (id: string, early: boolean) => {
    setTopicDrafts((prev) => {
      const cur = prev[id] ?? { checked: true, progress: '', early: false }
      return { ...prev, [id]: { ...cur, early, progress: early ? '100' : cur.progress } }
    })
  }

  const handleTopicPreset = (mode: 'all' | 'mine' | 'none') => {
    if (!workItems) return
    setTopicDrafts((prev) => {
      const next: Record<string, TopicDraftState> = { ...prev }
      for (const item of workItems.items) {
        const statProg = reportStats[item.id]?.topicProgress
        const cur = next[item.id] ?? {
          checked: false,
          progress: statProg !== null && statProg !== undefined ? String(statProg) : '',
          early: false,
        }
        const checked =
          mode === 'all' ? true : mode === 'mine' ? isWorkItemMine(item, user.username) : false
        next[item.id] = { ...cur, checked, early: checked ? cur.early : false }
      }
      return next
    })
  }

  const handleCalcWeighted = () => {
    if (!workItems) return
    const overrides: Record<string, number | null> = {}
    for (const item of workItems.items) {
      const draft = topicDrafts[item.id]
      if (!draft?.checked) continue
      if (draft.early) {
        overrides[item.id] = 100
      } else if (draft.progress.trim() !== '') {
        const num = Number(draft.progress)
        if (Number.isFinite(num) && num >= 0 && num <= 100) {
          overrides[item.id] = Math.round(num)
        }
      }
    }
    const { total, useEqualWeights } = calcWeightedTotalProgress(workItems, reportStats, overrides)
    form.setValue('progress', currentStatus === 'paused' && total === 100 ? 99 : total, {
      shouldDirty: true,
    })
    setCalcHint(
      useEqualWeights
        ? t('tasks.project.weightedCalcEqual', { total })
        : t('tasks.project.weightedCalcDone', { total }),
    )
  }

  const handleAiGenerate = async () => {
    setAiError(null)
    try {
      const res = await generateAi.mutateAsync({
        taskId: task.id,
        currentProgress: Number(form.getValues('progress')) || 0,
      })
      const generated = (res.text ?? '').trim()
      if (!generated) {
        setAiError(t('tasks.report.aiEmpty'))
        return
      }
      const existing = form.getValues('content')
      form.setValue('content', existing ? `${generated}\n\n${existing}` : generated, {
        shouldDirty: true,
      })
    } catch (err) {
      setAiError(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  const appendPastedFiles = (incoming: File[]) => {
    if (incoming.length === 0) return
    setFiles((prev) => [...prev, ...incoming])
  }

  const onSubmit = async (values: TaskReportFormValues) => {
    setSubmitError(null)
    const formData = new FormData()
    formData.append('username', user.username)
    formData.append('fullname', user.fullname || user.username)
    formData.append('content', values.content.trim())
    formData.append('progress', String(values.progress))
    formData.append('km_link', values.km_link.trim())
    formData.append('status', values.status)
    if (values.status === 'paused' && values.pause_reason.trim()) {
      formData.append('pause_reason', values.pause_reason.trim())
    }
    if (splitMembers.length > 0 && values.target_id) {
      formData.append('target_id', String(values.target_id))
    }

    if (workItems && workItems.items.length > 0) {
      const selectedTopics: Array<{ id: string; progress: number | null; early?: boolean }> = []
      for (const item of workItems.items) {
        const draft = topicDrafts[item.id]
        if (!draft?.checked) continue
        if (draft.early) {
          selectedTopics.push({ id: item.id, progress: 100, early: true })
          continue
        }
        const raw = draft.progress.trim()
        if (raw !== '') {
          const num = Number(raw)
          if (!Number.isFinite(num) || num < 0 || num > 100) {
            setSubmitError(t('tasks.project.topicProgressInvalid'))
            return
          }
          selectedTopics.push({ id: item.id, progress: Math.round(num) })
        } else {
          selectedTopics.push({ id: item.id, progress: null })
        }
      }
      if (selectedTopics.length > 0) {
        formData.append('work_topics', JSON.stringify(selectedTopics))
      }
    }

    for (const file of files) {
      formData.append('files', file)
    }

    try {
      await submitReport.mutateAsync({ taskId: task.id, formData })
      form.reset({
        content: '',
        progress: values.progress,
        km_link: '',
        status: values.status,
        pause_reason: values.status === 'paused' ? values.pause_reason : '',
        target_id: values.target_id,
      })
      setFiles([])
      setCalcHint(null)
      setTopicDrafts((prev) => {
        const next: Record<string, TopicDraftState> = {}
        for (const [key, val] of Object.entries(prev)) {
          next[key] = { ...val, checked: false, early: false }
        }
        return next
      })
    } catch (err) {
      setSubmitError(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  return {
    form,
    currentStatus,
    selfSplitMember,
    reportStats,
    files,
    setFiles,
    appendPastedFiles,
    submitError,
    aiError,
    calcHint,
    topicDrafts,
    isAiPending: generateAi.isPending,
    isSubmitPending: submitReport.isPending,
    handleStatusChange,
    handleTopicToggle,
    handleTopicProgressChange,
    handleTopicEarlyChange,
    handleTopicPreset,
    handleCalcWeighted,
    handleAiGenerate,
    onSubmit,
  }
}
