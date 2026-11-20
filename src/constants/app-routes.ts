export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  TASKS: '/tasks',
  TASK_NEW: '/tasks/new',
  TASK_DETAIL: (id: string | number = ':id') => `/tasks/${id}`,
  TASK_EDIT: (id: string | number = ':id') => `/tasks/${id}/edit`,
  PROFILE: '/profile',
} as const
