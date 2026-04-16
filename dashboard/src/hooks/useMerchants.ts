import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMerchants, fetchMerchantById, updateMerchant,
  deleteMerchant, verifyMerchant, suspendMerchant, banMerchant,
  type MerchantFilters,
} from '@/api/merchants'
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

function useMerchantMutation(fn: (id: string) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.merchants.all })
    },
  })
}

export function useVerifyMerchant() { return useMerchantMutation(verifyMerchant) }
export function useSuspendMerchant() { return useMerchantMutation(suspendMerchant) }
export function useBanMerchant() { return useMerchantMutation(banMerchant) }
export function useDeleteMerchant() { return useMerchantMutation(deleteMerchant) }

export function useUpdateMerchant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateMerchant>[1] }) =>
      updateMerchant(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.merchants.all })
    },
  })
}
