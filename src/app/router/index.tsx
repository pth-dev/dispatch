import * as React from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { APP_ROUTES } from '@/constants/app-routes'
import { getDefaultLandingRoute } from '@/app/nav-config'
import { useAppStore } from '@/app/store'
import { AppShell, RootRouteErrorBoundary, ErrorState } from '@/components/layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { RequireMenuPerm } from './RequireMenuPerm'

// Route-based code splitting per performance skill
const LoginPage = React.lazy(() => import('@/pages/login/LoginPage'))
const DashboardPage = React.lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const DepartmentDashboardPage = React.lazy(
  () => import('@/features/dashboard/pages/DepartmentDashboardPage'),
)
const TaskListPage = React.lazy(() => import('@/features/tasks/pages/TaskListPage'))
const TaskDetailPage = React.lazy(() => import('@/features/tasks/pages/TaskDetailPage'))
const TaskCreatePage = React.lazy(() => import('@/features/tasks/pages/TaskCreatePage'))
const MessagesPage = React.lazy(() => import('@/features/messages/pages/MessagesPage'))
const LessonsPage = React.lazy(() => import('@/features/lessons/pages/LessonsPage'))
const TodoPage = React.lazy(() => import('@/features/todo/pages/TodoPage'))
const KpiPeoplePage = React.lazy(() => import('@/features/kpi/pages/KpiPeoplePage'))
const KpiBriefPage = React.lazy(() => import('@/features/kpi/pages/KpiBriefPage'))
const AccountPage = React.lazy(() => import('@/features/account/pages/AccountPage'))
const ProfilePage = React.lazy(() => import('@/features/profile/pages/ProfilePage'))
const TaskCardFixturePreviewPage = import.meta.env.DEV
  ? React.lazy(() => import('@/features/tasks/pages/TaskCardFixturePreviewPage'))
  : null

function RouteFallback() {
  return <LoadingSpinner size="lg" className="min-h-dvh bg-background" />
}

function HomeRedirect() {
  const user = useAppStore((s) => s.user)
  return <Navigate to={getDefaultLandingRoute(user)} replace />
}

export const router = createBrowserRouter([
  ...(import.meta.env.DEV && TaskCardFixturePreviewPage
    ? [
        {
          path: '/dev/task-cards',
          element: (
            <React.Suspense fallback={<RouteFallback />}>
              <TaskCardFixturePreviewPage />
            </React.Suspense>
          ),
          errorElement: <RootRouteErrorBoundary />,
        },
      ]
    : []),
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
        element: <HomeRedirect />,
      },
      {
        path: APP_ROUTES.DASHBOARD,
        element: (
          <RequireMenuPerm perm="dashboard" level="r">
            <DashboardPage />
          </RequireMenuPerm>
        ),
      },
      {
        path: APP_ROUTES.DASHBOARD_DEPT,
        element: (
          <RequireMenuPerm perm="dash_dept" level="r">
            <DepartmentDashboardPage />
          </RequireMenuPerm>
        ),
      },
      {
        path: APP_ROUTES.TASKS,
        element: (
          <RequireMenuPerm perm="list" level="r">
            <TaskListPage />
          </RequireMenuPerm>
        ),
      },
      {
        path: APP_ROUTES.TASK_NEW,
        element: (
          <RequireMenuPerm perm="dashboard" level="w">
            <TaskCreatePage />
          </RequireMenuPerm>
        ),
      },
      {
        path: APP_ROUTES.TASK_EDIT(),
        element: (
          <RequireMenuPerm perm="dashboard" level="w">
            <TaskCreatePage />
          </RequireMenuPerm>
        ),
      },
      {
        path: APP_ROUTES.TASK_DETAIL(),
        element: (
          <RequireMenuPerm perm="list" level="r">
            <TaskDetailPage />
          </RequireMenuPerm>
        ),
      },
      {
        path: APP_ROUTES.TODO,
        element: (
          <RequireMenuPerm perm="todo" level="r">
            <TodoPage />
          </RequireMenuPerm>
        ),
      },
      {
        path: APP_ROUTES.MESSAGES,
        element: (
          <RequireMenuPerm perm="messages" level="r">
            <MessagesPage />
          </RequireMenuPerm>
        ),
      },
      {
        path: APP_ROUTES.LESSONS,
        element: (
          <RequireMenuPerm perm="learnknow" level="r">
            <LessonsPage />
          </RequireMenuPerm>
        ),
      },
      {
        path: APP_ROUTES.KPI,
        element: (
          <RequireMenuPerm perm="kpi_people" level="r">
            <KpiPeoplePage />
          </RequireMenuPerm>
        ),
      },
      {
        path: APP_ROUTES.KPI_BRIEF,
        element: (
          <RequireMenuPerm perm="kpi_brief" level="r">
            <KpiBriefPage />
          </RequireMenuPerm>
        ),
      },
      {
        path: '/sla',
        element: <Navigate to={APP_ROUTES.KPI} replace />,
      },
      {
        path: APP_ROUTES.ACCOUNT,
        element: <AccountPage />,
      },
      {
        path: APP_ROUTES.PROFILE,
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: '*',
    element: <ErrorState status="404" />,
  },
])
