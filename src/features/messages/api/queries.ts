import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, type ApiError } from '@/services/http'
import { RawMessageListSchema, type RawMessage } from '@/schemas/message'
import { messageKeys } from './keys'

export type CreateMessagePayload = {
  username: string
  fullname: string
  content: string
}

export type CreateMessageReplyPayload = {
  messageId: number
  username: string
  fullname: string
  content: string
}

function assertOptionalSuccessEnvelope(raw: unknown): void {
  if (typeof raw !== 'object' || raw === null || !('success' in raw)) {
    return
  }
  const obj = raw as { success?: unknown; message?: unknown; err?: unknown; code?: unknown }
  if (obj.success === false) {
    const err: ApiError = {
      status: 400,
      code: typeof obj.code === 'string' ? obj.code : undefined,
      message:
        typeof obj.message === 'string' && obj.message.trim().length > 0
          ? obj.message
          : typeof obj.err === 'string' && obj.err.trim().length > 0
            ? obj.err
            : 'Request failed',
      kind: 'business',
    }
    throw err
  }
}

export function useMessages() {
  return useQuery({
    queryKey: messageKeys.list(),
    queryFn: async ({ signal }): Promise<RawMessage[]> => {
      const raw = await http<unknown>('/messages', { signal })
      if (!Array.isArray(raw)) return []
      return RawMessageListSchema.parse(raw)
    },
    staleTime: 15_000,
  })
}

export function useCreateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateMessagePayload) => {
      const raw = await http<unknown>('/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      assertOptionalSuccessEnvelope(raw)
      return raw
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.list() })
    },
  })
}

export function useCreateMessageReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, username, fullname, content }: CreateMessageReplyPayload) => {
      const raw = await http<unknown>(`/messages/${messageId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ username, fullname, content }),
      })
      assertOptionalSuccessEnvelope(raw)
      return raw
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.list() })
    },
  })
}
