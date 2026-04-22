import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchOrders, fetchOrderById, updateOrderStatus, type OrderFilters } from '@/api/orders'
import { queryKeys } from '@/lib/queryKeys'

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(filters as Record<string, unknown>),
    queryFn: () => fetchOrders(filters),
    placeholderData: prev => prev,
    staleTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })
}

export function useOrderDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id!),
    queryFn: () => fetchOrderById(id!),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      updateOrderStatus(id, status, notes),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}
