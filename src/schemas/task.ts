import { z } from 'zod'

export const TaskStatusSchema = z.enum([
  'new',
  'draft',
  'in_progress',
  'pending',
  'approved',
  'done',
  'overdue',
  'rejected',
])

export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const TaskTimelineEventSchema = z.object({
  id: z.string(),
  time: z.string(),
  actor: z.string(),
  action: z.string(),
  note: z.string().optional(),
})

export type TaskTimelineEvent = z.infer<typeof TaskTimelineEventSchema>

export const TaskChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
})

export type TaskChecklistItem = z.infer<typeof TaskChecklistItemSchema>

export const TaskAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.string(),
  url: z.string().optional(),
})

export type TaskAttachment = z.infer<typeof TaskAttachmentSchema>

export const TaskCommentSchema = z.object({
  id: z.string(),
  author: z.string(),
  avatar: z.string().optional(),
  time: z.string(),
  content: z.string(),
})

export type TaskComment = z.infer<typeof TaskCommentSchema>

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  department: z.string(), // English ID, e.g. 'it', 'technical', 'accounting', 'hr', 'sales', 'operations', 'planning'
  departmentName: z.string().optional(),
  assignee: z.string(),
  assigneeAvatar: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  dueDate: z.string(),
  status: TaskStatusSchema,
  urgent: z.boolean().optional(),
  progress: z.number().min(0).max(100).default(0),
  timeline: z.array(TaskTimelineEventSchema).optional(),
  checklist: z.array(TaskChecklistItemSchema).optional(),
  attachments: z.array(TaskAttachmentSchema).optional(),
  comments: z.array(TaskCommentSchema).optional(),
})

export type Task = z.infer<typeof TaskSchema>

export const TaskCreateFormSchema = z.object({
  title: z.string().min(1, 'task.validation.titleRequired'),
  description: z.string().optional(),
  department: z.string().min(1, 'task.validation.departmentRequired'),
  assignee: z.string().min(1, 'task.validation.assigneeRequired'),
  dueDate: z.string().min(1, 'task.validation.dueDateRequired'),
  priority: z.enum(['normal', 'urgent']).default('normal'),
})

export type TaskCreateFormValues = z.infer<typeof TaskCreateFormSchema>

export const TaskReassignFormSchema = z.object({
  department: z.string().min(1, 'task.validation.departmentRequired'),
  assignee: z.string().min(1, 'task.validation.assigneeRequired'),
  reason: z.string().min(5, 'task.validation.reassignReasonRequired'),
})

export type TaskReassignFormValues = z.infer<typeof TaskReassignFormSchema>

export const TaskApproveFormSchema = z.object({
  note: z.string().optional(),
  checklistPassed: z.boolean().refine((val) => val === true, {
    message: 'task.validation.checklistRequired',
  }),
})

export type TaskApproveFormValues = z.infer<typeof TaskApproveFormSchema>

export const TaskRejectFormSchema = z.object({
  reason: z.string().min(5, 'task.validation.rejectReasonRequired'),
  action: z.enum(['request_revision', 'reject']),
})

export type TaskRejectFormValues = z.infer<typeof TaskRejectFormSchema>

export const TaskListParamsSchema = z.object({
  scope: z.enum(['mine', 'created', 'all']).default('mine'),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  department: z.string().optional(),
  status: TaskStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(50)]).default(10),
})

export type TaskListParams = z.infer<typeof TaskListParamsSchema>

export const TaskScopeCountsSchema = z.object({
  mine: z.number(),
  created: z.number(),
  all: z.number(),
})

export type TaskScopeCounts = z.infer<typeof TaskScopeCountsSchema>

export const TaskListResponseSchema = z.object({
  items: z.array(TaskSchema),
  total: z.number(),
  counts: TaskScopeCountsSchema,
})

export type TaskListResponse = z.infer<typeof TaskListResponseSchema>
