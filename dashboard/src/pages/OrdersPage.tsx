import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, ShoppingBag, CheckSquare, Square, Download, FileText } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrders } from '@/hooks/useOrders'
import { bulkUpdateOrderStatus, bulkExportOrders } from '@/api/bulkOperations'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { OrderDetailDialog } from '@/components/orders/OrderDetailDialog'
import { formatUGX, formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { Order, OrderStatus } from '@/types'

export default function OrdersPage() {
  const [sp, setSp] = useSearchParams()
  const queryClient = useQueryClient()
  const hasPermission = useAuthStore(s => s.hasPermission)
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<OrderStatus | null>(null)
  
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

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: OrderStatus }) => 
      bulkUpdateOrderStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setSelectedIds(new Set())
      setBulkStatusUpdate(null)
    },
  })

  const handleRowClick = (order: Order) => {
    setSelectedOrderId(order.id)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedOrderId(null)
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (!data?.results?.length) return

    if (selectedIds.size === (data.results ?? []).length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set((data.results ?? []).map(o => o.id)))
    }
  }

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.size === 0 || !bulkStatusUpdate) return
    await bulkUpdateMutation.mutateAsync({ ids: Array.from(selectedIds), status: bulkStatusUpdate })
  }

  const handleExport = async () => {
    try {
      const blob = await bulkExportOrders({
        search,
        status,
        page: 1,
        page_size: 10000 // Export all matching orders
      })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export orders:', error)
    }
  }

  const canBulkUpdate = hasPermission('manage_orders') && selectedIds.size > 0

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Unable to load orders. You may need to be logged in with merchant permissions.</p>
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
            <Badge variant="secondary" className="text-sm">
              {data.count} total
            </Badge>
            {(data.results ?? []).filter(o => o.status === 'NEW').length > 0 && (
              <Badge variant="warning" className="text-sm">
                {(data.results ?? []).filter(o => o.status === 'NEW').length} new
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
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

      {/* Bulk Actions Bar */}
      {canBulkUpdate && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{selectedIds.size} order{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="flex gap-2 ml-auto">
              <Select
                value={bulkStatusUpdate ?? ''}
                onChange={(e) => setBulkStatusUpdate(e.target.value as OrderStatus)}
                className="w-40"
              >
                <option value="">Change status to...</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
              <Button
                size="sm"
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatusUpdate || bulkUpdateMutation.isPending}
              >
                <FileText className="h-4 w-4 mr-2" />
                Update Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Bulk Status Update Dialog */}
      <Dialog
        open={!!bulkStatusUpdate && selectedIds.size > 0}
        onClose={() => setBulkStatusUpdate(null)}
        title="Bulk Status Update"
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm">
            Are you sure you want to update <strong>{selectedIds.size}</strong> order{selectedIds.size > 1 ? 's' : ''} to <strong>{bulkStatusUpdate}</strong>?
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleBulkStatusUpdate}
              disabled={bulkUpdateMutation.isPending}
            >
              Update {selectedIds.size} Orders
            </Button>
            <Button
              variant="outline"
              onClick={() => setBulkStatusUpdate(null)}
              disabled={bulkUpdateMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {canBulkUpdate && (
                  <button onClick={toggleSelectAll} className="hover:opacity-70">
                    {data && selectedIds.size === (data.results ?? []).length && selectedIds.size > 0
                      ? <CheckSquare className="h-4 w-4" />
                      : <Square className="h-4 w-4" />
                    }
                  </button>
                )}
              </TableHead>
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
            <TableSkeleton rows={8} cols={9} />
          ) : (
            <TableBody>
              {!data?.results.length ? (
                <TableEmpty colSpan={9} message="No orders found. Orders will appear here once created." />
              ) : (
                (data.results ?? []).map((o: Order) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      {canBulkUpdate && (
                        <button onClick={() => toggleSelect(o.id)} className="hover:opacity-70">
                          {selectedIds.has(o.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium" onClick={() => handleRowClick(o)}>{o.order_number}</TableCell>
                    <TableCell className="text-sm" onClick={() => handleRowClick(o)}>{o.buyer_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground" onClick={() => handleRowClick(o)}>{o.merchant_name}</TableCell>
                    <TableCell className="text-sm font-semibold">{formatUGX(o.total_amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.expected_delivery_date ?? '—'}</TableCell>
                    <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleRowClick(o) }}>
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
        open={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  )
}
