import { useOrderDetail, useUpdateOrderStatus } from '@/hooks/useOrders'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { formatUGX, formatDateTime } from '@/lib/utils'
import { queryKeys } from '@/lib/queryKeys'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { OrderStatus } from '@/types'

interface OrderDetailDialogProps {
  orderId: string | null
  open: boolean
  onClose: () => void
}

export function OrderDetailDialog({ orderId, open, onClose }: OrderDetailDialogProps) {
  const { data: order, isLoading, error } = useOrderDetail(orderId)
  const queryClient = useQueryClient()
  const mutation = useUpdateOrderStatus()
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null)

  if (!open) return null

  const handleStatusChange = (status: OrderStatus) => {
    setPendingStatus(status)
    setShowConfirm(true)
  }

  const confirmStatusChange = () => {
    if (!orderId || !pendingStatus) return
    mutation.mutate(
      { id: orderId, status: pendingStatus },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
          queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
          setShowConfirm(false)
          setPendingStatus(null)
          onClose()
        },
      }
    )
  }

  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} title="Order Details" size="lg">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Dialog>
    )
  }

  if (error || !order) {
    return (
      <Dialog open={open} onClose={onClose} title="Order Details" size="lg">
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">Failed to load order details.</p>
        </div>
      </Dialog>
    )
  }

  const canConfirm = order.status === 'NEW' || order.status === 'CONTACTED'
  const canCancel = order.status !== 'CANCELLED' && order.status !== 'COMPLETED'

  return (
    <>
      <Dialog open={open} onClose={onClose} title={`Order ${order.order_number}`} size="lg">
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <OrderStatusBadge status={order.status} />
            <span className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Buyer</p>
              <p className="text-sm font-medium">{order.buyer_name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Merchant</p>
              <p className="text-sm font-medium">{order.merchant_name}</p>
            </div>
          </div>

          {order.address && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Delivery Address</p>
              <p className="text-sm">
                {order.address.address_line1}
                {order.address.address_line2 && `, ${order.address.address_line2}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.address.area}, {order.address.district}, {order.address.region}
              </p>
            </div>
          )}

          {order.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Items</p>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium px-4 py-2">Item</th>
                    <th className="text-right text-xs font-medium px-4 py-2">Qty</th>
                    <th className="text-right text-xs font-medium px-4 py-2">Unit Price</th>
                    <th className="text-right text-xs font-medium px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-2 text-sm">{item.listing_title}</td>
                      <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatUGX(item.unit_price)}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium">{formatUGX(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div>
              {order.delivery_fee && (
                <p className="text-sm text-muted-foreground">Delivery: {formatUGX(order.delivery_fee)}</p>
              )}
              {order.expected_delivery_date && (
                <p className="text-xs text-muted-foreground">Expected: {order.expected_delivery_date}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{formatUGX(order.total_amount)}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            {canConfirm && (
              <Button
                onClick={() => handleStatusChange('CONFIRMED')}
                disabled={mutation.isPending}
                className="flex-1"
              >
                {mutation.isPending ? 'Updating...' : 'Confirm Order'}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={mutation.isPending}
                className="flex-1"
              >
                {mutation.isPending ? 'Updating...' : 'Cancel Order'}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Status Change"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm">
            Are you sure you want to change the order status to <strong>{pendingStatus}</strong>?
          </p>
          <div className="flex gap-3">
            <Button onClick={confirmStatusChange} disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Updating...' : 'Confirm'}
            </Button>
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
