import { http, HttpResponse, delay } from 'msw'
import { MOCK_TASKS } from '../data/tasks'
import { DEPARTMENTS, DEPARTMENT_NAME_BY_ID } from '../data/departments'
import type { Task, TaskListResponse, TaskStatus } from '@/schemas/task'
import { useAppStore } from '@/app/store'

// Mutable in-memory state for development mocking
const tasksState: Task[] = [...MOCK_TASKS]

export const taskHandlers = [
  // ── GET /api/tasks ────────────────────────────────────────────────────────
  http.get('/api/tasks', async ({ request }) => {
    const { mockDelayMs, mockScenario } = useAppStore.getState()
    if (mockDelayMs > 0) {
      await delay(mockDelayMs)
    }

    if (mockScenario === '500') {
      return new HttpResponse(JSON.stringify({ message: 'Internal Server Error (Simulated)' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (mockScenario === '401') {
      return new HttpResponse(JSON.stringify({ message: 'Unauthorized (Simulated)' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (mockScenario === '403') {
      return new HttpResponse(JSON.stringify({ message: 'Forbidden (Simulated)' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (mockScenario === 'empty') {
      const response: TaskListResponse = {
        items: [],
        total: 0,
        counts: { mine: 0, created: 0, all: 0 },
      }
      return HttpResponse.json(response)
    }

    const url = new URL(request.url)
    const scope = (url.searchParams.get('scope') || 'mine') as 'mine' | 'created' | 'all'
    const search = (url.searchParams.get('search') || '').trim().toLowerCase()
    const fromDate = url.searchParams.get('fromDate') || ''
    const toDate = url.searchParams.get('toDate') || ''
    const department = url.searchParams.get('department') || ''
    const status = url.searchParams.get('status') as TaskStatus | null
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const pageSize = Math.max(1, parseInt(url.searchParams.get('pageSize') || '10', 10))

    const currentUserName = 'Nguyễn An'

    // Compute counts for all scopes regardless of active search/filters (per brief §5.1)
    const countMine = tasksState.filter((t) => t.assignee === currentUserName).length
    const countCreated = tasksState.filter((t) => t.createdBy === currentUserName).length
    const countAll = tasksState.length

    // Filter by scope
    let filtered = tasksState.filter((task) => {
      if (scope === 'mine') return task.assignee === currentUserName
      if (scope === 'created') return task.createdBy === currentUserName
      return true
    })

    // Filter by keyword search (code or title)
    if (search) {
      filtered = filtered.filter(
        (task) =>
          task.id.toLowerCase().includes(search) || task.title.toLowerCase().includes(search),
      )
    }

    // Filter by date range (createdAt or dueDate)
    if (fromDate) {
      filtered = filtered.filter((task) => task.createdAt >= fromDate || task.dueDate >= fromDate)
    }
    if (toDate) {
      filtered = filtered.filter((task) => task.createdAt <= toDate || task.dueDate <= toDate)
    }

    // Filter by department (English ID)
    if (department && department !== 'all') {
      filtered = filtered.filter((task) => task.department === department)
    }

    // Filter by status
    if (status && (status as string) !== 'all') {
      filtered = filtered.filter((task) => task.status === status)
    }

    const total = filtered.length
    const startIndex = (page - 1) * pageSize
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize)

    const response: TaskListResponse = {
      items: paginatedItems,
      total,
      counts: {
        mine: countMine,
        created: countCreated,
        all: countAll,
      },
    }

    return HttpResponse.json(response)
  }),

  // ── GET /api/tasks/:id ────────────────────────────────────────────────────
  http.get('/api/tasks/:id', async ({ params }) => {
    const { mockDelayMs, mockScenario } = useAppStore.getState()
    if (mockDelayMs > 0) {
      await delay(mockDelayMs)
    }

    if (mockScenario === '404') {
      return new HttpResponse(JSON.stringify({ message: 'Task Not Found (Simulated)' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const id = params.id as string
    const task = tasksState.find((t) => t.id === id)

    if (!task) {
      return new HttpResponse(JSON.stringify({ message: `Task ${id} not found` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return HttpResponse.json(task)
  }),

  // ── POST /api/tasks ───────────────────────────────────────────────────────
  http.post('/api/tasks', async ({ request }) => {
    const body = (await request.json()) as {
      title: string
      description?: string
      department: string
      assignee: string
      dueDate: string
      priority?: 'normal' | 'urgent'
    }

    const nextNumber = tasksState.length + 892
    const id = `NV-2026-${nextNumber.toString().padStart(4, '0')}`
    const departmentName = DEPARTMENT_NAME_BY_ID[body.department] || body.department

    const newTask: Task = {
      id,
      title: body.title,
      description: body.description || '',
      department: body.department,
      departmentName,
      assignee: body.assignee,
      createdBy: 'Nguyễn An',
      createdAt: new Date().toISOString().split('T')[0],
      dueDate: body.dueDate,
      status: 'new',
      urgent: body.priority === 'urgent',
      progress: 0,
      checklist: [
        { id: `c_${id}_1`, text: 'Bắt đầu tiếp nhận và xử lý', completed: false },
        { id: `c_${id}_2`, text: 'Nộp báo cáo hoàn thành', completed: false },
      ],
      timeline: [
        {
          id: `t_${id}_1`,
          time: new Date().toLocaleString('vi-VN'),
          actor: 'Nguyễn An',
          action: 'Khởi tạo nhiệm vụ',
          note: `Giao cho ${body.assignee}`,
        },
      ],
      attachments: [],
      comments: [],
    }

    tasksState.unshift(newTask)
    return HttpResponse.json(newTask, { status: 201 })
  }),

  // ── POST /api/tasks/:id/approve ───────────────────────────────────────────
  http.post('/api/tasks/:id/approve', async ({ params, request }) => {
    const id = params.id as string
    const body = (await request.json().catch(() => ({}))) as { note?: string }
    const taskIndex = tasksState.findIndex((t) => t.id === id)

    if (taskIndex === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Task not found' }), { status: 404 })
    }

    const task = tasksState[taskIndex]
    task.status = 'approved'
    task.progress = 100
    task.timeline = task.timeline || []
    task.timeline.push({
      id: `t_${id}_${Date.now()}`,
      time: new Date().toLocaleString('vi-VN'),
      actor: 'Người duyệt',
      action: 'Phê duyệt nghiệm thu hoàn thành',
      note: body.note || 'Đạt yêu cầu nghiệm thu.',
    })

    return HttpResponse.json(task)
  }),

  // ── POST /api/tasks/:id/reject ────────────────────────────────────────────
  http.post('/api/tasks/:id/reject', async ({ params, request }) => {
    const id = params.id as string
    const body = (await request.json().catch(() => ({}))) as {
      reason: string
      action: 'request_revision' | 'reject'
    }
    const taskIndex = tasksState.findIndex((t) => t.id === id)

    if (taskIndex === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Task not found' }), { status: 404 })
    }

    const task = tasksState[taskIndex]
    task.status = body.action === 'reject' ? 'rejected' : 'in_progress'
    task.timeline = task.timeline || []
    task.timeline.push({
      id: `t_${id}_${Date.now()}`,
      time: new Date().toLocaleString('vi-VN'),
      actor: 'Người duyệt',
      action:
        body.action === 'reject'
          ? 'Từ chối nghiệm thu'
          : 'Yêu cầu chỉnh sửa bổ sung',
      note: body.reason,
    })

    return HttpResponse.json(task)
  }),

  // ── PATCH /api/tasks/:id/reassign ─────────────────────────────────────────
  http.patch('/api/tasks/:id/reassign', async ({ params, request }) => {
    const id = params.id as string
    const body = (await request.json().catch(() => ({}))) as {
      department: string
      assignee: string
      reason: string
    }
    const taskIndex = tasksState.findIndex((t) => t.id === id)

    if (taskIndex === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Task not found' }), { status: 404 })
    }

    const task = tasksState[taskIndex]
    const oldAssignee = task.assignee
    task.department = body.department
    task.departmentName = DEPARTMENT_NAME_BY_ID[body.department] || body.department
    task.assignee = body.assignee
    task.timeline = task.timeline || []
    task.timeline.push({
      id: `t_${id}_${Date.now()}`,
      time: new Date().toLocaleString('vi-VN'),
      actor: 'Trưởng bộ phận',
      action: 'Giao lại nhiệm vụ',
      note: `Chuyển từ ${oldAssignee} sang ${body.assignee}. Lý do: ${body.reason}`,
    })

    return HttpResponse.json(task)
  }),

  // ── GET /api/departments ──────────────────────────────────────────────────
  http.get('/api/departments', async () => {
    return HttpResponse.json(DEPARTMENTS)
  }),
]
