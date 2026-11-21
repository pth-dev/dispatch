import { useTranslation } from 'react-i18next'
import { sameDept } from '@/utils/task-domain'
import { getDeptDisplayName } from '../api/meta'
import { useMetaDepts } from '../api/queries'

export function useDeptNameResolver() {
  const { i18n } = useTranslation()
  const { data: metaDepts } = useMetaDepts()
  const deptCatalog = metaDepts?.allDepts ?? metaDepts?.depts ?? []

  return (rawDept: string | null | undefined): string => {
    if (!rawDept) return '-'
    const match = deptCatalog.find((d) => sameDept(d.value, rawDept))
    return match ? getDeptDisplayName(match, i18n.language) : rawDept
  }
}
