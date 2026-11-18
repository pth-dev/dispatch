import { z } from 'zod'

export const LoginFormSchema = z.object({
  username: z.string().min(1, 'required'),
  password: z.string().min(1, 'required'),
})

export type LoginFormValues = z.infer<typeof LoginFormSchema>
