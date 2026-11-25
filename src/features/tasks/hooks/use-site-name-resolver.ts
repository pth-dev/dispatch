import { useTranslation } from 'react-i18next'
import { getSiteDisplayName } from '../api/meta'
import { useMetaSites } from '../api/queries'

export function useSiteNameResolver() {
  const { i18n } = useTranslation()
  const { data: metaSites } = useMetaSites()
  const siteCatalog = metaSites?.allSites ?? metaSites?.sites ?? []

  return (code: string): string => {
    const normalized = code.trim().toUpperCase()
    const match = siteCatalog.find((s) => s.value.trim().toUpperCase() === normalized)
    return match ? getSiteDisplayName(match, i18n.language) : code
  }
}
