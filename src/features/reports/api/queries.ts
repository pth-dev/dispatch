import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  OfficeFilesResponseSchema,
  WebReportListResponseSchema,
  WebReportSaveResponseSchema,
  type OfficeFileItem,
  type ReportPurpose,
  type WebReportItem,
} from '@/schemas/report'
import {
  RawReportListSchema,
  RawTaskListSchema,
  type RawReport,
  type RawTask,
} from '@/schemas/task'
import { http, httpText } from '@/services'
import { reportKeys } from './keys'

export function useReportTasks(
  params: {
    purpose: ReportPurpose
    start: string
    end: string
    includeCycles?: boolean
    basis?: 'final' | 'created'
  },
  enabled = true,
) {
  return useQuery({
    queryKey: reportKeys.tasks(params.purpose, params.start, params.end, {
      includeCycles: params.includeCycles,
      basis: params.basis,
    }),
    queryFn: async ({ signal }): Promise<RawTask[]> => {
      const qs = new URLSearchParams({ purpose: params.purpose })
      if (params.start) qs.set('start', params.start)
      if (params.end) qs.set('end', params.end)
      if (params.includeCycles) qs.set('include_cycles', '1')
      if (params.basis) qs.set('basis', params.basis)
      const raw = await http<unknown>(`/reports/tasks?${qs.toString()}`, {
        method: 'GET',
        signal,
      })
      return RawTaskListSchema.parse(raw)
    },
    enabled,
    staleTime: 60 * 1000,
  })
}

export async function fetchTaskReportsForPdf(taskId: number): Promise<RawReport[]> {
  const raw = await http<unknown>(`/tasks/${taskId}/reports`, { method: 'GET' })
  return RawReportListSchema.parse(raw)
}

export async function fetchOfficeFilesForReport(
  ids: number[],
  purpose: ReportPurpose = 'progress',
): Promise<OfficeFileItem[]> {
  if (ids.length === 0) return []
  const raw = await http<unknown>('/reports/office-files', {
    method: 'POST',
    body: JSON.stringify({ ids, purpose }),
  })
  return OfficeFilesResponseSchema.parse(raw).files
}

export function useWebReports(enabled = true) {
  return useQuery({
    queryKey: reportKeys.webreports(),
    queryFn: async ({ signal }): Promise<WebReportItem[]> => {
      const raw = await http<unknown>('/webreports', { method: 'GET', signal })
      return WebReportListResponseSchema.parse(raw).items
    },
    enabled,
    staleTime: 60 * 1000,
  })
}

export type SaveWebReportPayload = {
  title: string
  lang: string
  file_base: string
  html: string
  subject: string
  subject_label: string
  range_start: string
  range_end: string
  total: number
  report_no: string
}

export function useSaveWebReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SaveWebReportPayload) => {
      const raw = await http<unknown>('/webreports', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return WebReportSaveResponseSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.webreports() })
    },
  })
}

export function useDeleteWebReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const raw = await http<unknown>(`/webreports/${id}`, { method: 'DELETE' })
      return WebReportSaveResponseSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.webreports() })
    },
  })
}

export async function fetchArchivedWebReportHtml(id: number): Promise<string> {
  return httpText(`/webreports/${id}`, { method: 'GET' })
}
