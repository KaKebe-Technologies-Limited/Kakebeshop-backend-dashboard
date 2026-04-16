import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, ShoppingBag } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { OrderDetailDialog } from '@/components/orders/OrderDetailDialog'
import { formatUGX, formatDateTime } from '@/lib/utils'
import type { Order } from '@/types'

export default function OrdersPage() {
  const [sp, setSp] = useSearchParams()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const page = parseInt(sp.get('page') ?? '1', 10)
  const q = sp.get('q') ?? ''
  const status = sp.get('status') ?? ''
  const merchantId = sp.get('merchant_id') ?? ''

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading, error } = useOrders({
    page,
    q: q || undefined,
    status: status || undefined,
    merchant_id: merchantId || undefined,
  })

  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)
  const newCount = (data?.results ?? []).filter((o: Order) => o.status === 'NEW').length

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Unable to load orders. Check your permissions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Orders
          </h1>
          <p className="text-muted-foreground mt-0.5">Manage and track customer orders</p>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{data.count} total</Badge>
            {newCount > 0 && <Badge variant="warning">{newCount} new</Badge>}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={v => set('q', v)} placeholder="Search orders…" className="w-64" />
        <Select value={status} onChange={e => set('status', e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        {(q || status || merchantId) && (
          <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={8} cols={8} />
          ) : (
            <TableBody>
              {!(data?.results?.length) ? (
                <TableEmpty colSpan={8} message="No orders found." />
              ) : (
                (data.results ?? []).map((o: Order) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedOrderId(o.id)}
                  >
                    <TableCell className="font-mono text-xs font-medium">{o.order_number}</TableCell>
                    <TableCell className="text-sm">
                      <div>{o.buyer_name}</div>
                      {o.buyer_email && <div className="text-xs text-muted-foreground">{o.buyer_email}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.merchant_name}</TableCell>
                    <TableCell className="text-sm font-semibold">{formatUGX(o.total_amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.expected_delivery_date ?? '—'}</TableCell>
                    <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrderId(o.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          )}
        </Table>
        {data && (
          <Pagination page={page} totalPages={totalPages} count={data.count} onPage={p => set('page', String(p))} />
        )}
      </Card>

      <OrderDetailDialog
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  )
}
