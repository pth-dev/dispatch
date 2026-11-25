import { useQuery } from '@tanstack/react-query'
import { SHARED_QUERY_KEYS } from '@/constants/query-keys'
import { fetchMetaDepts, fetchMetaSites } from '@/hooks/use-meta'
import { FALLBACK_REGISTER_DEPTS, FALLBACK_REGISTER_SITES } from './register-catalog'

export function useRegisterCatalog() {
  const { data: deptsMeta } = useQuery({
    queryKey: SHARED_QUERY_KEYS.metaDepts,
    queryFn: () => fetchMetaDepts(),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })

  const { data: sitesMeta } = useQuery({
    queryKey: SHARED_QUERY_KEYS.metaSites,
    queryFn: () => fetchMetaSites(),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })

  const serverDepts = deptsMeta?.depts ?? []
  const serverSites = sitesMeta?.sites ?? []

  return {
    depts: serverDepts.length > 0 ? serverDepts : FALLBACK_REGISTER_DEPTS,
    sites: serverSites.length > 0 ? serverSites : FALLBACK_REGISTER_SITES,
  }
}
