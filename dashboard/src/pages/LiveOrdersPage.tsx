import { useState, useEffect, useRef } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { OrderDetailDialog } from '@/components/orders/OrderDetailDialog'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatUGX, formatDateTime } from '@/lib/utils'
import { ShoppingBag, Bell, BellOff, RefreshCw, Phone, Mail } from 'lucide-react'
import type { Order } from '@/types'

// Track seen order IDs across renders
const alertedIds = new Set<string>()

export default function LiveOrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())
  const isFirstLoad = useRef(true)
  const audioCtx = useRef<AudioContext | null>(null)

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useOrders({
    ordering: '-created_at',
  })

  // Play a beep using Web Audio API — no external file needed
  const playBeep = () => {
    if (!soundEnabled) return
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext()
      const ctx = audioCtx.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.value = 880
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
    } catch {
      // AudioContext not available
    }
  }

  useEffect(() => {
    if (!data?.results) return

    if (isFirstLoad.current) {
      data.results.forEach(o => alertedIds.add(o.id))
      isFirstLoad.current = false
      return
    }

    const incoming = data.results.filter(o => o.status === 'NEW' && !alertedIds.has(o.id))
    if (incoming.length > 0) {
      incoming.forEach(o => alertedIds.add(o.id))
      setNewOrderIds(prev => new Set([...prev, ...incoming.map(o => o.id)]))
      playBeep()
      // Flash the tab title
      document.title = `🔔 ${incoming.length} New Order${incoming.length > 1 ? 's' : ''}! — Kakebe`
      setTimeout(() => { document.title = 'Kakebe Shop · Admin' }, 5000)
    }
  }, [data, soundEnabled])

  const clearNew = (id: string) => setNewOrderIds(prev => { const s = new Set(prev); s.delete(id); return s })

  const newOrders = (data?.results ?? []).filter(o => o.status === 'NEW')
  const otherOrders = (data?.results ?? []).filter(o => o.status !== 'NEW')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" /> Live Orders
            {newOrderIds.size > 0 && (
              <span className="animate-bounce inline-flex items-center justify-center h-6 w-6 rounded-full bg-destructive text-white text-xs font-bold">
                {newOrderIds.size}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Auto-refreshes every 30s · Last updated: {dataUpdatedAt ? formatDateTime(new Date(dataUpdatedAt).toISOString()) : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSoundEnabled(s => !s)}>
            {soundEnabled ? <Bell className="h-4 w-4 mr-1" /> : <BellOff className="h-4 w-4 mr-1" />}
            Sound {soundEnabled ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex gap-2">
            <Badge variant="secondary">{data?.count ?? 0} total</Badge>
            {newOrders.length > 0 && <Badge variant="warning">{newOrders.length} new</Badge>}
          </div>
        </div>
      </div>

      {/* New Orders — highlighted */}
      {newOrders.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-600 flex items-center gap-1">
            <Bell className="h-4 w-4" /> New Orders Requiring Attention
          </p>
          {newOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              isNew={newOrderIds.has(order.id)}
              onClick={() => { setSelectedOrderId(order.id); clearNew(order.id) }}
            />
          ))}
        </div>
      )}

      {/* All other orders */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {otherOrders.length === 0 && newOrders.length === 0 && (
            <Card className="flex items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">No orders yet. New orders will appear here automatically.</p>
            </Card>
          )}
          {otherOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              isNew={false}
              onClick={() => setSelectedOrderId(order.id)}
            />
          ))}
        </div>
      )}

      <OrderDetailDialog
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  )
}

function OrderCard({ order, isNew, onClick }: { order: Order; isNew: boolean; onClick: () => void }) {
  return (
    <Card
      className={`p-4 cursor-pointer hover:bg-muted/50 transition-all ${isNew ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold">{order.order_number}</span>
            <OrderStatusBadge status={order.status} />
            {isNew && <Badge variant="warning" className="animate-pulse">New!</Badge>}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div>
              <span className="text-xs text-muted-foreground">Buyer: </span>
              <span className="text-sm font-medium">{order.buyer_name}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Merchant: </span>
              <span className="text-sm">{order.merchant_name}</span>
            </div>
            {order.buyer_phone && (
              <a
                href={`tel:${order.buyer_phone}`}
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Phone className="h-3 w-3" /> {order.buyer_phone}
              </a>
            )}
            {order.buyer_email && (
              <a
                href={`mailto:${order.buyer_email}`}
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Mail className="h-3 w-3" /> {order.buyer_email}
              </a>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold">{formatUGX(order.total_amount)}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </Card>
  )
}
