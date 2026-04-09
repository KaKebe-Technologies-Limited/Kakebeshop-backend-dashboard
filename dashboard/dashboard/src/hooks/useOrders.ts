import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchOrders, fetchOrderById, fetchOrderGroups, updateOrderStatus, type OrderFilters } from '@/api/orders'
import { queryKeys } from '@/lib/queryKeys'

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(filters as Record<string, unknown>),
    queryFn: () => fetchOrders(filters),
    placeholderData: prev => prev,
    staleTime: 20_000,
  })
}

export function useOrderDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id!),
    queryFn: () => fetchOrderById(id!),
    enabled: !!id,
  })
}

export function useOrderGroups(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: queryKeys.orderGroups.list(filters as Record<string, unknown>),
    queryFn: () => fetchOrderGroups(filters),
    placeholderData: prev => prev,
    staleTime: 20_000,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}
