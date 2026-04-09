import { useQuery } from '@tanstack/react-query'
import { fetchMerchants, fetchMerchantById, type MerchantFilters } from '@/api/merchants'
import { queryKeys } from '@/lib/queryKeys'

export function useMerchants(filters: MerchantFilters = {}) {
  return useQuery({
    queryKey: queryKeys.merchants.list(filters as Record<string, unknown>),
    queryFn: () => fetchMerchants(filters),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}

export function useMerchantDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.merchants.detail(id!),
    queryFn: () => fetchMerchantById(id!),
    enabled: !!id,
    staleTime: 60_000,
  })
}
