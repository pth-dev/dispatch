import * as React from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { APP_ROUTES } from '@/constants/app-routes'

const ROUTE_TITLE_KEYS: Record<string, string> = {
  [APP_ROUTES.LOGIN]: 'login.title',
  [APP_ROUTES.DASHBOARD]: 'nav.dashboard',
  [APP_ROUTES.DASHBOARD_DEPT]: 'nav.dashboardDept',
  [APP_ROUTES.TASKS]: 'nav.tasks',
  [APP_ROUTES.TASK_NEW]: 'tasks.createForm.title',
  [APP_ROUTES.TODO]: 'nav.todo',
  [APP_ROUTES.MESSAGES]: 'nav.messages',
  [APP_ROUTES.LESSONS]: 'nav.lessons',
  [APP_ROUTES.KPI]: 'nav.kpi',
  [APP_ROUTES.KPI_BRIEF]: 'nav.kpiBrief',
  [APP_ROUTES.WORKLOG]: 'nav.worklog',
  [APP_ROUTES.REPORTS]: 'nav.reports',
  [APP_ROUTES.ACCOUNT]: 'nav.account',
  [APP_ROUTES.PROFILE]: 'nav.profile',
}

const TASK_EDIT_PATTERN = /^\/tasks\/(\d+)\/edit$/
const TASK_DETAIL_PATTERN = /^\/tasks\/(\d+)$/

/** Resolve a localized document title for the given pathname. */
export function resolveDocumentTitle(pathname: string, t: TFunction): string {
  const normalized = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  let pageTitle: string | null = null
  const staticKey = ROUTE_TITLE_KEYS[normalized]
  if (staticKey) {
    pageTitle = t(staticKey)
  } else {
    const editMatch = TASK_EDIT_PATTERN.exec(normalized)
    if (editMatch) {
      pageTitle = t('tasks.createForm.editTitle', { id: editMatch[1] })
    } else {
      const detailMatch = TASK_DETAIL_PATTERN.exec(normalized)
      if (detailMatch) {
        pageTitle = `${t('tasks.detail.title')} #${detailMatch[1]}`
      }
    }
  }

  return pageTitle ? `${pageTitle} · ${t('app.name')}` : t('app.fullTitle')
}

function setMetaContent(selector: string, content: string): void {
  const element = document.head.querySelector<HTMLMetaElement>(selector)
  if (element) {
    element.setAttribute('content', content)
  }
}

/** Sync `<html lang>`, `document.title`, and head meta tags with the active route and locale. */
export function useDocumentMetadata(): void {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()

  const title = resolveDocumentTitle(pathname, t)
  const description = t('app.description')
  const logoAlt = t('app.logoAlt')
  const lang = i18n.language

  React.useEffect(() => {
    document.documentElement.lang = lang
    document.title = title
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:title"]', title)
    setMetaContent('meta[property="og:description"]', description)
    setMetaContent('meta[property="og:image:alt"]', logoAlt)
    setMetaContent('meta[name="twitter:title"]', title)
    setMetaContent('meta[name="twitter:description"]', description)
  }, [description, lang, logoAlt, title])
}
