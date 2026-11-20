import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createBrowserRouter, Navigate } from 'react-router'
import { APP_ROUTES } from '@/constants/app-routes'
import { AppShell, RootRouteErrorBoundary, ErrorState } from '@/components/layout'

// Route-based code splitting per performance skill
const LoginPage = React.lazy(() => import('@/pages/login/LoginPage'))
const TaskListPage = React.lazy(() => import('@/features/tasks/pages/TaskListPage'))
const TaskDetailPage = React.lazy(() => import('@/features/tasks/pages/TaskDetailPage'))
const TaskCreatePage = React.lazy(() => import('@/features/tasks/pages/TaskCreatePage'))
const ProfilePage = React.lazy(() => import('@/features/profile/pages/ProfilePage'))

function RouteFallback() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh items-center justify-center text-xs text-muted-foreground">
      {t('common.loading')}
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: APP_ROUTES.LOGIN,
    element: (
      <React.Suspense fallback={<RouteFallback />}>
        <LoginPage />
      </React.Suspense>
    ),
    errorElement: <RootRouteErrorBoundary />,
  },
  {
    path: APP_ROUTES.HOME,
    element: <AppShell />,
    errorElement: <RootRouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to={APP_ROUTES.TASKS} replace />,
      },
      {
        path: 'tasks',
        element: <TaskListPage />,
      },
      {
        path: 'tasks/new',
        element: <TaskCreatePage />,
      },
      {
        path: 'tasks/:id/edit',
        element: <TaskCreatePage />,
      },
      {
        path: 'tasks/:id',
        element: <TaskDetailPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: '*',
    element: <ErrorState status="404" />,
  },
])
