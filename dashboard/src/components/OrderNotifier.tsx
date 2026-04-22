import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOrders } from '@/api/orders'
import { ntfyService } from '@/services/ntfyService'
import { useAuthStore } from '@/stores/authStore'
import type { Order } from '@/types'

const STORAGE_KEY = 'kakebe_notified_order_ids'
const MAX_STORED = 200 // keep last 200 to avoid unbounded growth

function loadNotifiedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function saveNotifiedIds(ids: Set<string>) {
  try {
    const arr = [...ids].slice(-MAX_STORED)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch { /* ignore */ }
}

// In-memory set seeded from localStorage — persists across page refreshes
const notifiedIds = loadNotifiedIds()

export function OrderNotifier() {
  const access = useAuthStore(s => s.access)
  const isFirstFetch = useRef(true)

  const { data } = useQuery({
    queryKey: ['order-notifier'],
    queryFn: () => fetchOrders({ ordering: '-created_at' }),
    enabled: !!access,
    staleTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (!data?.results) return

    if (isFirstFetch.current) {
      isFirstFetch.current = false
      // On first load, seed ALL current orders so we don't spam on login
      // But only seed orders older than 5 minutes — very recent ones still notify
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      data.results.forEach((o: Order) => {
        if (new Date(o.created_at).getTime() < fiveMinutesAgo) {
          notifiedIds.add(o.id)
        } else {
          console.log('[OrderNotifier] Recent order found on load:', o.order_number)
        }
      })
      saveNotifiedIds(notifiedIds)
    }

    const newOrders = data.results.filter(
      (o: Order) => o.status === 'NEW' && !notifiedIds.has(o.id)
    )

    console.log('[OrderNotifier] Polled', data.results.length, 'orders,', newOrders.length, 'new to notify')

    for (const order of newOrders) {
      notifiedIds.add(order.id)
      saveNotifiedIds(notifiedIds)
      console.log('[OrderNotifier] Sending ntfy for:', order.order_number)
      void ntfyService.sendNotification(
        {
          title: 'New Order - Kakebe Shop',
          tags: ['shopping_cart', 'bell'],
          priority: 'high',
        },
        `Order #${order.order_number}\nBuyer: ${order.buyer_name}\nPhone: ${order.buyer_phone ?? 'N/A'}\nMerchant: ${order.merchant_name}\nTotal: UGX ${order.total_amount}`
      )
    }
  }, [data])

  return null
}
