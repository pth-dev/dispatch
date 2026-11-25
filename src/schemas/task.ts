import { z } from 'zod'

export const DERIVED_TASK_STATUSES = [
  'not_started',
  'in_progress',
  'delayed_pending',
  'completed_ontime',
  'late_completed',
] as const

export const DerivedTaskStatusSchema = z.enum(DERIVED_TASK_STATUSES)
export type DerivedTaskStatus = z.infer<typeof DerivedTaskStatusSchema>

export const TaskStatusFilterSchema = z.enum([
  'incomplete',
  'completed',
  ...DERIVED_TASK_STATUSES,
  'paused',
])
export type TaskStatusFilter = z.infer<typeof TaskStatusFilterSchema>

export const TASK_SORT_MODES = [
  'default',
  'oldest',
  'due_asc',
  'due_desc',
  'progress_asc',
  'progress_desc',
  'level',
] as const
export const TaskSortSchema = z.enum(TASK_SORT_MODES)
export type TaskSortMode = z.infer<typeof TaskSortSchema>

export const TASK_LEVEL_FILTERS = ['critical', 'urgent', 'normal'] as const
export const TaskLevelFilterSchema = z.enum(TASK_LEVEL_FILTERS)
export type TaskLevelFilter = z.infer<typeof TaskLevelFilterSchema>

export const TASK_CONFIDENTIAL_FILTERS = ['1', '2', '3'] as const
export const TaskConfidentialFilterSchema = z.enum(TASK_CONFIDENTIAL_FILTERS)
export type TaskConfidentialFilter = z.infer<typeof TaskConfidentialFilterSchema>

export const TASK_FLAG_FILTERS = ['recurring', 'recur_today', 'cross', 'reader'] as const
export const TaskFlagFilterSchema = z.enum(TASK_FLAG_FILTERS)
export type TaskFlagFilter = z.infer<typeof TaskFlagFilterSchema>

export const EMPTY_SITE_FILTER = '__EMPTY__'

export const ConfidentialLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
])
export type ConfidentialLevel = z.infer<typeof ConfidentialLevelSchema>

export const RecurTypeSchema = z.enum(['once', 'weekly', 'monthly'])
export type RecurType = z.infer<typeof RecurTypeSchema>

export const RawAttachmentSchema = z.object({
  name: z.string(),
  path: z.string(),
  size: z.number().nullish(),
})
export type RawAttachment = z.infer<typeof RawAttachmentSchema>

export const SplitMemberSchema = z.object({
  id: z.number(),
  assignee: z.string(),
  progress: z.number(),
  paused: z.boolean(),
  finish_date: z.string(),
})
export type SplitMember = z.infer<typeof SplitMemberSchema>

export const WORK_ITEMS_MAX = 60

export const WORK_ITEMS_RULES = ['none', 'sun', 'satsun'] as const
export const WorkItemsRuleSchema = z.enum(WORK_ITEMS_RULES)
export type WorkItemsRule = z.infer<typeof WorkItemsRuleSchema>

export const WorkItemSchema = z.object({
  id: z.string(),
  topic: z.string().default(''),
  content: z.string().default(''),
  risk: z.string().default(''),
  owner_ou: z.string().default(''),
  owner: z.string().default(''),
  agent: z.string().default(''),
  start: z.string().default(''),
  end: z.string().default(''),
  deduct: z.coerce.number().default(0),
  progress: z.coerce.number().optional(),
})
export type WorkItem = z.infer<typeof WorkItemSchema>

export const WorkItemsEnvelopeSchema = z.object({
  v: z.number().default(1),
  rule: WorkItemsRuleSchema.default('sun'),
  items: z.array(WorkItemSchema).default([]),
})
export type WorkItemsEnvelope = z.infer<typeof WorkItemsEnvelopeSchema>

export const WorkTopicReportEntrySchema = z.object({
  id: z.string(),
  topic: z.string().optional(),
  progress: z.number().int().min(0).max(100).nullable().optional(),
  early: z.boolean().optional(),
})
export type WorkTopicReportEntry = z.infer<typeof WorkTopicReportEntrySchema>

export const AiGenerateReportResponseSchema = z.object({
  success: z.boolean(),
  text: z.string().nullish(),
  code: z.string().nullish(),
  message: z.string().nullish(),
  err: z.string().nullish(),
})
export type AiGenerateReportResponse = z.infer<typeof AiGenerateReportResponseSchema>

export const RawTaskSchema = z.object({
  id: z.coerce.number(),
  title: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  title_vn: z.string().nullish(),
  content: z.string().nullish(),
  content_vn: z.string().nullish(),
  precautions: z.string().nullish(),
  level: z.string().nullish(),
  risk_status: z.string().nullish(),
  task_type: z.string().nullish(),
  install_req: z.string().nullish(),
  type_detail: z.union([z.string(), z.record(z.string(), z.array(z.string()))]).nullish(),
  work_items: z.union([z.string(), WorkItemsEnvelopeSchema]).nullish(),
  cost_estimate: z.string().nullish(),
  req_dept: z.string().nullish(),
  req_depts: z.string().nullish(),
  req_contact: z.string().nullish(),
  assigned_unit: z.string().nullish(),
  assign_person: z.string().nullish(),
  site: z.string().nullish(),
  km_link: z.string().nullish(),
  attachments: z.union([z.string(), z.array(RawAttachmentSchema)]).nullish(),
  progress: z.coerce
    .number()
    .nullish()
    .transform((v) => (v == null || Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v)))),
  paused: z.coerce
    .number()
    .nullish()
    .transform((v) => (v === 1 ? 1 : 0)),
  paused_at: z.string().nullish(),
  paused_by: z.string().nullish(),
  pause_reason: z.string().nullish(),
  confidential: z.coerce
    .number()
    .nullish()
    .transform((v): ConfidentialLevel => {
      if (v === 1 || v === 2 || v === 3) return v
      return 0
    }),
  readers: z.string().nullish(),
  cross_dept: z.coerce
    .number()
    .nullish()
    .transform((v) => (v === 1 ? 1 : 0)),
  cross_viewers: z.string().nullish(),
  recur_type: z.string().nullish(),
  recur_weekdays: z.string().nullish(),
  recur_monthdays: z.string().nullish(),
  recur_time: z.string().nullish(),
  recur_end: z.string().nullish(),
  recur_cycle_date: z.string().nullish(),
  recur_cycle_start: z.string().nullish(),
  recur_next_date: z.string().nullish(),
  is_cycle: z.union([z.boolean(), z.coerce.number()]).nullish(),
  cycle_no: z.coerce.number().nullish(),
  cycle_date: z.string().nullish(),
  kpi_at: z.string().nullish(),
  split_group: z.coerce.number().nullish(),
  split_seq: z.coerce.number().nullish(),
  split_members: z.string().nullish(),
  reporter: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  reporter_name: z.string().nullish(),
  reporter_dept: z.string().nullish(),
  due_date: z.string().nullish(),
  finish_date: z.string().nullish(),
  dispatch_date: z.string().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  first_response_mins: z.coerce.number().nullish(),
  all_reports: z.union([z.string(), z.array(z.unknown())]).nullish(),
  last_report: z.unknown().nullish(),
  last_report_meta: z.unknown().nullish(),
})

export type RawTask = z.infer<typeof RawTaskSchema>
export const RawTaskListSchema = z.array(RawTaskSchema)

export const RawReportSchema = z.object({
  id: z.coerce.number(),
  task_id: z.coerce.number(),
  username: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  fullname: z.string().nullish(),
  content: z.string().nullish(),
  attachments: z.union([z.string(), z.array(RawAttachmentSchema)]).nullish(),
  km_link: z.string().nullish(),
  createdAt: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  updatedAt: z.string().nullish(),
  progress: z.coerce.number().nullish(),
  pause_action: z.string().nullish(),
  work_topics: z.union([z.string(), z.array(z.unknown())]).nullish(),
  split_assignee: z.string().nullish(),
  split_seq: z.coerce.number().nullish(),
})

export type RawReport = z.infer<typeof RawReportSchema>
export const RawReportListSchema = z.array(RawReportSchema)

export const DupCheckResponseSchema = z.object({
  success: z.boolean().optional(),
  duplicate: z.boolean(),
  id: z.coerce.number().nullish(),
  title: z.string().nullish(),
  due_date: z.string().nullish(),
  visible: z.boolean().optional(),
})
export type DupCheckResponse = z.infer<typeof DupCheckResponseSchema>

export const TaskMutationResponseSchema = z.object({
  success: z.boolean(),
  id: z.coerce.number().nullish(),
  recur_cycle_date: z.string().nullish(),
  unit_synced: z.boolean().nullish(),
  assigned_unit: z.string().nullish(),
  unit_person: z.string().nullish(),
  cross_unknown: z.array(z.string()).nullish(),
  readers_unknown: z.array(z.string()).nullish(),
  split_created: z.number().nullish(),
  split_group: z.number().nullish(),
  split_kept: z.array(z.string()).nullish(),
  code: z.string().nullish(),
  message: z.string().nullish(),
  err: z.string().nullish(),
})
export type TaskMutationResponse = z.infer<typeof TaskMutationResponseSchema>

export const ReportMutationResponseSchema = z.object({
  success: z.boolean(),
  closed: z.boolean().nullish(),
  cycle_done: z.boolean().nullish(),
  task_id: z.coerce.number().nullish(),
  code: z.string().nullish(),
  message: z.string().nullish(),
  err: z.string().nullish(),
})
export type ReportMutationResponse = z.infer<typeof ReportMutationResponseSchema>

export const DeleteAttachmentResponseSchema = z.object({
  success: z.boolean(),
  attachments: z.array(RawAttachmentSchema).nullish(),
  code: z.string().nullish(),
  message: z.string().nullish(),
  err: z.string().nullish(),
})
export type DeleteAttachmentResponse = z.infer<typeof DeleteAttachmentResponseSchema>

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const TaskListParamsSchema = z.object({
  scope: z.enum(['mine', 'created', 'all']).default('all'),
  search: z.string().optional(),
  fromDate: z.string().regex(ISO_DATE_RE).optional(),
  toDate: z.string().regex(ISO_DATE_RE).optional(),
  department: z.string().optional(),
  status: TaskStatusFilterSchema.optional(),
  site: z.string().optional(),
  level: TaskLevelFilterSchema.optional(),
  taskType: z.string().optional(),
  confidential: TaskConfidentialFilterSchema.optional(),
  flags: z.array(TaskFlagFilterSchema).optional(),
  sort: TaskSortSchema.default('default'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(50)]).default(10),
})
export type TaskListParams = z.infer<typeof TaskListParamsSchema>

export type TaskScopeCounts = {
  mine: number
  created: number
  all: number
}

export const MAX_UPLOAD_FILE_MB = 50
export const MAX_UPLOAD_FILE_BYTES = MAX_UPLOAD_FILE_MB * 1024 * 1024
export const MAX_ASSIGNEES_LIMIT = 20
export const MAX_VIEWERS_LIMIT = 100
export const UNCLASSIFIED_TASK_TYPE = '未分類 / Chưa phân loại'

export const TaskReportFormSchema = z
  .object({
    content: z.string(),
    progress: z.number().int().min(0).max(100),
    km_link: z.string(),
    status: z.enum(['running', 'paused']),
    pause_reason: z.string(),
    target_id: z.number().optional(),
  })
  .refine(
    (data) => !(data.status === 'paused' && data.progress === 100),
    {
      path: ['progress'],
      message: 'tasks.validation.pausedCannotBe100',
    },
  )
export type TaskReportFormValues = z.infer<typeof TaskReportFormSchema>

export const TaskEditorFormSchema = z
  .object({
    title: z.string().trim().min(1, 'tasks.validation.titleRequired'),
    content: z.string(),
    precautions: z.string(),
    level: z.string(),
    risk_status: z.string(),
    task_type: z
      .string()
      .trim()
      .min(1, 'tasks.validation.taskTypeRequired')
      .refine((v) => v !== UNCLASSIFIED_TASK_TYPE, 'tasks.validation.taskTypeRequired'),
    req_depts: z.array(z.string().min(1)).min(1, 'tasks.validation.reqDeptRequired'),
    req_contact: z.string().trim().min(1, 'tasks.validation.reqContactRequired'),
    site: z.array(z.string().min(1)).min(1, 'tasks.validation.siteRequired'),
    assigned_unit: z.string().trim().min(1, 'tasks.validation.departmentRequired'),
    assign_person: z
      .array(z.string().min(1))
      .max(MAX_ASSIGNEES_LIMIT, 'tasks.validation.maxAssignees'),
    due_date: z.string(),
    recur_type: RecurTypeSchema,
    recur_weekdays: z.array(z.number().int().min(1).max(7)),
    recur_monthdays: z.array(z.number().int().min(1).max(31)),
    recur_time: z.string(),
    recur_end: z.string(),
    confidential: ConfidentialLevelSchema,
    readers: z.array(z.string()).max(MAX_VIEWERS_LIMIT, 'tasks.validation.maxUsers'),
    cross_dept: z.boolean(),
    cross_viewers: z.array(z.string()).max(MAX_VIEWERS_LIMIT, 'tasks.validation.maxUsers'),
    cost_estimate: z.string(),
    km_link: z.string(),
  })
  .refine(
    (data) => data.recur_type !== 'once' || data.due_date.trim().length > 0,
    {
      path: ['due_date'],
      message: 'tasks.validation.dueDateRequired',
    },
  )
  .refine(
    (data) => data.recur_type !== 'weekly' || data.recur_weekdays.length > 0,
    {
      path: ['recur_weekdays'],
      message: 'tasks.validation.recurWeekdaysRequired',
    },
  )
  .refine(
    (data) => data.recur_type !== 'monthly' || data.recur_monthdays.length > 0,
    {
      path: ['recur_monthdays'],
      message: 'tasks.validation.recurMonthdaysRequired',
    },
  )
export type TaskEditorFormValues = z.infer<typeof TaskEditorFormSchema>
