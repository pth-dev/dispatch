import type { SessionUser } from '@/schemas/auth'
import type { RawAttachment, RawTask, TaskEditorFormValues } from '@/schemas/task'
import {
  parseAssigneeList,
  parseRecurInts,
  parseReqDepts,
  parseSites,
  toLocalDateString,
} from '@/utils/task-domain'

import {
  DEFAULT_RISK_STATUS,
  DEFAULT_TASK_LEVEL,
  isStandardTaskType,
} from './task-catalog'

export const DEFAULT_DUE_TIME = '19:00'
export const DEFAULT_RECUR_TIME = '17:00'
export const DAILY_REPAIR_TITLE = '日常维修'
export const DAILY_REPAIR_PRECAUTIONS = '服务user，满足user需求，遵从公司规定'
export const DAILY_REPAIR_UNIT = '資訊部'

export function getDefaultDueDateTime(now: Date = new Date()): string {
  return `${toLocalDateString(now)}T${DEFAULT_DUE_TIME}`
}

export function buildDailyRepairTaskValues(user: SessionUser | null): TaskEditorFormValues {
  const base = buildDefaultTaskEditorValues(user)
  return {
    ...base,
    title: DAILY_REPAIR_TITLE,
    precautions: DAILY_REPAIR_PRECAUTIONS,
    assigned_unit: DAILY_REPAIR_UNIT,
    assign_person: user?.username ? [user.username] : [],
    due_date: getDefaultDueDateTime(),
    recur_type: 'once',
  }
}

function toDateTimeLocalValue(raw: string | null | undefined): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 16)
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)) {
    return `${trimmed.slice(0, 10)}T${trimmed.slice(11, 16)}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T${DEFAULT_DUE_TIME}`
  }
  return trimmed
}

export function buildDefaultTaskEditorValues(
  user: SessionUser | null,
  sourceTask?: RawTask,
): TaskEditorFormValues {
  if (!sourceTask) {
    return {
      title: '',
      content: '',
      precautions: '',
      level: DEFAULT_TASK_LEVEL,
      risk_status: DEFAULT_RISK_STATUS,
      task_type: '',
      req_depts: user?.dept ? [user.dept] : [],
      req_contact: user?.username ?? '',
      site: user?.site ? [user.site.toUpperCase()] : [],
      assigned_unit: user?.dept ?? '',
      assign_person: [],
      due_date: getDefaultDueDateTime(),
      recur_type: 'once',
      recur_weekdays: [],
      recur_monthdays: [],
      recur_time: DEFAULT_RECUR_TIME,
      recur_end: '',
      confidential: 0,
      readers: [],
      cross_dept: false,
      cross_viewers: [],
      cost_estimate: '',
      km_link: '',
    }
  }

  const recurType =
    sourceTask.recur_type === 'weekly' || sourceTask.recur_type === 'monthly'
      ? sourceTask.recur_type
      : 'once'

  return {
    title: sourceTask.title,
    content: sourceTask.content ?? '',
    precautions: sourceTask.precautions ?? '',
    level: sourceTask.level || DEFAULT_TASK_LEVEL,
    risk_status: sourceTask.risk_status || DEFAULT_RISK_STATUS,
    task_type: sourceTask.task_type ?? '',
    req_depts: parseReqDepts(sourceTask.req_depts, sourceTask.req_dept),
    req_contact: sourceTask.req_contact || user?.username || '',
    site: parseSites(sourceTask.site),
    assigned_unit: sourceTask.assigned_unit || user?.dept || '',
    assign_person: parseAssigneeList(sourceTask.assign_person),
    due_date: toDateTimeLocalValue(sourceTask.due_date),
    recur_type: recurType,
    recur_weekdays: parseRecurInts(sourceTask.recur_weekdays, 1, 7),
    recur_monthdays: parseRecurInts(sourceTask.recur_monthdays, 1, 31),
    recur_time: sourceTask.recur_time || DEFAULT_RECUR_TIME,
    recur_end: sourceTask.recur_end ?? '',
    confidential: sourceTask.confidential,
    readers: parseAssigneeList(sourceTask.readers, 100),
    cross_dept: sourceTask.cross_dept === 1,
    cross_viewers: parseAssigneeList(sourceTask.cross_viewers, 100),
    cost_estimate: sourceTask.cost_estimate ?? '',
    km_link: sourceTask.km_link ?? '',
  }
}

export type BuildTaskFormDataOptions = {
  mode: 'create' | 'edit' | 'clone'
  values: TaskEditorFormValues
  reporter: string
  newFiles: File[]
  retainedFiles?: RawAttachment[]
  cloneFromId?: number
  /** Original `work_items` JSON string preserved verbatim on PUT (Decision #8). */
  preservedWorkItems?: string | null
  preservedTypeDetail?: string | null
  preservedInstallReq?: string | null
}

export function buildTaskFormData(options: BuildTaskFormDataOptions): FormData {
  const { mode, values, reporter, newFiles, retainedFiles = [], cloneFromId } = options
  const formData = new FormData()

  formData.append('title', values.title.trim())
  formData.append('confidential', String(values.confidential))
  formData.append('readers', values.readers.join(','))
  formData.append('cross_dept', values.cross_dept ? '1' : '0')
  formData.append('cross_viewers', values.cross_dept ? values.cross_viewers.join(',') : '')
  formData.append('content', values.content)
  formData.append('site', values.site.join(','))
  formData.append('level', values.level)
  formData.append('req_dept', values.req_depts[0] ?? '')
  formData.append('req_depts', JSON.stringify(values.req_depts))
  formData.append('req_dept_custom', JSON.stringify([]))
  formData.append('req_contact', values.req_contact.trim())
  const trimmedTaskType = values.task_type.trim()
  formData.append('task_type', trimmedTaskType)
  formData.append('task_type_is_custom', trimmedTaskType && !isStandardTaskType(trimmedTaskType) ? '1' : '0')
  formData.append('install_req', options.preservedInstallReq ?? '')
  formData.append('type_detail', options.preservedTypeDetail ?? '')
  formData.append('work_items', options.preservedWorkItems ?? '')
  formData.append('cost_estimate', values.cost_estimate)
  formData.append('precautions', values.precautions)
  formData.append('risk_status', values.risk_status)
  formData.append('assigned_unit', values.assigned_unit)
  formData.append('assign_person', values.assign_person.join(','))
  formData.append('due_date', values.due_date)
  formData.append('recur_type', values.recur_type)
  formData.append('recur_weekdays', values.recur_weekdays.join(','))
  formData.append('recur_monthdays', values.recur_monthdays.join(','))
  formData.append('recur_time', values.recur_time)
  formData.append('recur_end', values.recur_end)
  formData.append('km_link', values.km_link.trim())
  formData.append('reporter', reporter)

  if (mode === 'edit') {
    formData.append('retainedFiles', JSON.stringify(retainedFiles))
  } else if (mode === 'clone' && cloneFromId) {
    formData.append('clone_from', String(cloneFromId))
    formData.append('cloneFiles', JSON.stringify(retainedFiles))
  }

  for (const file of newFiles) {
    formData.append('files', file)
  }

  return formData
}
