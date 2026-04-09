import { useSearchParams } from 'react-router-dom'
import { useReports } from '@/hooks/useReports'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ReportStatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { Report } from '@/types'

const reasonLabels: Record<string, string> = {
  SPAM: 'Spam',
  INAPPROPRIATE: 'Inappropriate',
  SCAM: 'Scam',
  FAKE: 'Fake',
  OFFENSIVE: 'Offensive',
  OTHER: 'Other',
}

const reasonVariant: Record<string, 'destructive' | 'warning' | 'info' | 'muted'> = {
  SPAM: 'muted',
  INAPPROPRIATE: 'warning',
  SCAM: 'destructive',
  FAKE: 'destructive',
  OFFENSIVE: 'warning',
  OTHER: 'muted',
}

export default function ReportsPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)
  const status = sp.get('status') ?? ''
  const reason = sp.get('reason') ?? ''

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading, error } = useReports({
    page,
    ...(status ? { status } : {}),
    ...(reason ? { reason } : {}),
    ordering: '-created_at',
  })
  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Unable to load reports. Authentication required.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onChange={e => set('status', e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </Select>
        <Select value={reason} onChange={e => set('reason', e.target.value)} className="w-44">
          <option value="">All reasons</option>
          {Object.entries(reasonLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        {(status || reason) && (
          <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reason</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : (
            <TableBody>
              {!data?.results.length ? (
                <TableEmpty colSpan={5} message="No reports found." />
              ) : (
                data.results.map((r: Report) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant={reasonVariant[r.reason] ?? 'muted'}>{reasonLabels[r.reason] ?? r.reason}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[280px] truncate text-muted-foreground">{r.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.listing ? 'Listing' : r.merchant ? 'Merchant' : r.reported_user ? 'User' : '—'}
                    </TableCell>
                    <TableCell><ReportStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
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
