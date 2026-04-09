import { useSearchParams } from 'react-router-dom'
import { useTransactions } from '@/hooks/useReports'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TransactionStatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { formatUGX, formatDateTime } from '@/lib/utils'
import type { Transaction } from '@/types'

const methodLabel: Record<string, string> = {
  CASH: 'Cash',
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Bank Transfer',
  CARD: 'Card',
}

export default function TransactionsPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)
  const status = sp.get('status') ?? ''
  const method = sp.get('method') ?? ''

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading, error } = useTransactions({
    page,
    ...(status ? { status } : {}),
    ...(method ? { payment_method: method } : {}),
    ordering: '-created_at',
  })
  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Unable to load transactions. Authentication required.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onChange={e => set('status', e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </Select>
        <Select value={method} onChange={e => set('method', e.target.value)} className="w-44">
          <option value="">All methods</option>
          {Object.entries(methodLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        {(status || method) && (
          <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Txn #</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <TableBody>
              {!data?.results.length ? (
                <TableEmpty colSpan={7} message="No transactions found." />
              ) : (
                data.results.map((t: Transaction) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.transaction_number}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.order_number}</TableCell>
                    <TableCell className="font-semibold text-sm">{formatUGX(t.amount)}</TableCell>
                    <TableCell><Badge variant="secondary">{methodLabel[t.payment_method] ?? t.payment_method}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.payment_reference ?? '—'}</TableCell>
                    <TableCell><TransactionStatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</TableCell>
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
