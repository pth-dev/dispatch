import { useQuery } from '@tanstack/react-query'
import { fetchPublicMetaDepts, fetchPublicMetaSites } from '@/services'
import { FALLBACK_REGISTER_DEPTS, FALLBACK_REGISTER_SITES } from './register-catalog'

export function useRegisterCatalog() {
  const { data: serverDepts = [] } = useQuery({
    queryKey: ['public-meta', 'depts'],
    queryFn: ({ signal }) => fetchPublicMetaDepts(signal),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })

  const { data: serverSites = [] } = useQuery({
    queryKey: ['public-meta', 'sites'],
    queryFn: ({ signal }) => fetchPublicMetaSites(signal),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })

  return {
    depts: serverDepts.length > 0 ? serverDepts : FALLBACK_REGISTER_DEPTS,
    sites: serverSites.length > 0 ? serverSites : FALLBACK_REGISTER_SITES,
  }
}
