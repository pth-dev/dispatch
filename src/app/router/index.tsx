import * as React from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { APP_ROUTES } from '@/constants/app-routes'
import { AppShell, RootRouteErrorBoundary, ErrorState } from '@/components/layout'

// Route-based code splitting per performance skill
const LoginPage = React.lazy(() => import('@/pages/login/LoginPage'))
const TaskListPage = React.lazy(() => import('@/features/tasks/pages/TaskListPage'))
const TaskDetailPage = React.lazy(() => import('@/features/tasks/pages/TaskDetailPage'))
const TaskApprovePage = React.lazy(() => import('@/features/tasks/pages/TaskApprovePage'))
const TaskCreatePage = React.lazy(() => import('@/features/tasks/pages/TaskCreatePage'))
const DashboardPage = React.lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const LessonsPage = React.lazy(() => import('@/features/lessons/pages/LessonsPage'))
const MessagesPage = React.lazy(() => import('@/features/messages/pages/MessagesPage'))
const TodoPage = React.lazy(() => import('@/features/todo/pages/TodoPage'))
const SlaPage = React.lazy(() => import('@/features/sla/pages/SlaPage'))
const ProfilePage = React.lazy(() => import('@/features/profile/pages/ProfilePage'))
const AdminUsersPage = React.lazy(() => import('@/features/admin/pages/AdminUsersPage'))
const AdminRolesPage = React.lazy(() => import('@/features/admin/pages/AdminRolesPage'))
const AdminDepartmentsPage = React.lazy(() => import('@/features/admin/pages/AdminDepartmentsPage'))

export const router = createBrowserRouter([
  {
    path: APP_ROUTES.LOGIN,
    element: (
      <React.Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center text-xs text-muted-foreground">
            Đang tải...
          </div>
        }
      >
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
        path: 'tasks/:id',
        element: <TaskDetailPage />,
      },
      {
        path: 'tasks/:id/approve',
        element: <TaskApprovePage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'messages',
        element: <MessagesPage />,
      },
      {
        path: 'lessons',
        element: <LessonsPage />,
      },
      {
        path: 'todo',
        element: <TodoPage />,
      },
      {
        path: 'sla',
        element: <SlaPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'admin/users',
        element: <AdminUsersPage />,
      },
      {
        path: 'admin/roles',
        element: <AdminRolesPage />,
      },
      {
        path: 'admin/departments',
        element: <AdminDepartmentsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <ErrorState status="404" />,
  },
])
