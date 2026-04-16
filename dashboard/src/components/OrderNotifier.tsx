import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOrders } from '@/api/orders'
import { ntfyService } from '@/services/ntfyService'
import { useAuthStore } from '@/stores/authStore'
import type { Order } from '@/types'

const seenOrderIds = new Set<string>()

export function OrderNotifier() {
  const access = useAuthStore(s => s.access)
  const isFirstFetch = useRef(true)

  const { data } = useQuery({
    queryKey: ['order-notifier'],
    queryFn: () => fetchOrders({ ordering: '-created_at' }),
    enabled: !!access,
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (!data?.results) return

    if (isFirstFetch.current) {
      // Seed existing orders — don't notify on first load
      data.results.forEach((o: Order) => seenOrderIds.add(o.id))
      isFirstFetch.current = false
      return
    }

    const newOrders = data.results.filter(
      (o: Order) => o.status === 'NEW' && !seenOrderIds.has(o.id)
    )

    for (const order of newOrders) {
      seenOrderIds.add(order.id)
      void ntfyService.sendNotification(
        {
          title: '🛒 New Order — Kakebe Shop',
          tags: ['shopping_cart', 'bell'],
          priority: 'high',
        },
        `Order #${order.order_number}\nBuyer: ${order.buyer_name}\nMerchant: ${order.merchant_name}\nTotal: UGX ${order.total_amount}`
      )
    }
  }, [data])

  return null
}
