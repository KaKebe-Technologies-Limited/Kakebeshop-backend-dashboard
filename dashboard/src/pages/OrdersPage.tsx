import { useSearchParams } from 'react-router-dom'
import { useOrders } from '@/hooks/useOrders'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { formatUGX, formatDateTime } from '@/lib/utils'
import type { Order } from '@/types'

export default function OrdersPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)
  const search = sp.get('search') ?? ''
  const status = sp.get('status') ?? ''

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading, error } = useOrders({ page, search: search || undefined, status: status || undefined, ordering: '-created_at' })
  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Unable to load orders. You may need to be logged in with merchant permissions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={v => set('search', v)} placeholder="Search orders…" className="w-64" />
        <Select value={status} onChange={e => set('status', e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        {(search || status) && (
          <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
        )}
      </div>

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
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <TableBody>
              {!data?.results.length ? (
                <TableEmpty colSpan={7} message="No orders found." />
              ) : (
                data.results.map((o: Order) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs font-medium">{o.order_number}</TableCell>
                    <TableCell className="text-sm">{o.buyer_name}</TableCell>
                    <TableCell className="text-sm">{o.merchant_name}</TableCell>
                    <TableCell className="text-sm font-semibold">{formatUGX(o.total_amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.expected_delivery_date ?? '—'}</TableCell>
                    <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</TableCell>
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
    </div>
  )
}
