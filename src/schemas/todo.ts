import { z } from 'zod'

export const IsoCalendarDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [yearStr, monthStr, dayStr] = value.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)
    const day = Number(dayStr)
    const date = new Date(year, month - 1, day)
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  }, 'Invalid calendar date')

export const TodoItemSchema = z.object({
  id: z.coerce.number().int().positive(),
  start_time: z
    .string()
    .nullish()
    .transform((value) => (value ?? '').trim()),
})

export const TodoResponseSchema = z.object({
  task_data: z.array(TodoItemSchema).default([]),
})

export const SaveTodoResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    err: z.string().optional(),
    code: z.string().optional(),
  })
  .passthrough()

export type TodoItem = z.infer<typeof TodoItemSchema>
export type TodoResponse = z.infer<typeof TodoResponseSchema>

export interface SaveTodoPayload {
  date: string
  task_data: TodoItem[]
}
