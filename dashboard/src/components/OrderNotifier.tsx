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

    console.log('[OrderNotifier] Checking orders:', data.results.length, 'total')

    if (isFirstFetch.current) {
      isFirstFetch.current = false
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000

      data.results.forEach((o: Order) => {
        const orderAge = new Date(o.created_at).getTime()
        if (orderAge < twoMinutesAgo) {
          seenOrderIds.add(o.id)
        } else {
          console.log('[OrderNotifier] Fresh order on load:', o.order_number, 'age:', Math.round((Date.now() - orderAge) / 1000), 'seconds')
        }
      })
    }

    const newOrders = data.results.filter(
      (o: Order) => o.status === 'NEW' && !seenOrderIds.has(o.id)
    )

    console.log('[OrderNotifier] New orders to notify:', newOrders.length)

    for (const order of newOrders) {
      seenOrderIds.add(order.id)
      console.log('[OrderNotifier] Sending ntfy for order:', order.order_number)
      void ntfyService.sendNotification(
        {
          title: '🛒 New Order — Kakebe Shop',
          tags: ['shopping_cart', 'bell'],
          priority: 'high',
        },
        `Order #${order.order_number}\nBuyer: ${order.buyer_name}\nPhone: ${order.buyer_phone ?? 'N/A'}\nMerchant: ${order.merchant_name}\nTotal: UGX ${order.total_amount}`
      )
    }
  }, [data])

  return null
}
