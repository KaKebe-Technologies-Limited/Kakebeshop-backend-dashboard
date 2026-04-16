import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { fetchOrders, fetchOrderById, updateOrderStatus, type OrderFilters } from '@/api/orders'
import { queryKeys } from '@/lib/queryKeys'
import { ntfyService } from '@/services/ntfyService'
import type { Order } from '@/types'

export function useOrders(filters: OrderFilters = {}) {
  const seenIds = useRef<Set<string>>(new Set())

  return useQuery({
    queryKey: queryKeys.orders.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const data = await fetchOrders(filters)
      const newOrders = (data.results ?? []).filter(
        (o: Order) => o.status === 'NEW' && !seenIds.current.has(o.id)
      )
      for (const order of newOrders) {
        seenIds.current.add(order.id)
        void ntfyService.sendNotification(
          { title: '🛒 New Order', tags: ['shopping_cart', 'bell'], priority: 'high' },
          `Order #${order.order_number}\nBuyer: ${order.buyer_name}\nMerchant: ${order.merchant_name}\nTotal: UGX ${order.total_amount}`
        )
      }
      return data
    },
    placeholderData: prev => prev,
    staleTime: 20_000,
    refetchInterval: 30_000,
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
