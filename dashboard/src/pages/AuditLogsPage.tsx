import { useAuditLogs } from '@/hooks/useReports'
import { useSearchParams } from 'react-router-dom'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/types'

export default function AuditLogsPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)

  const { data, isLoading, error } = useAuditLogs({ page, ordering: '-created_at' })
  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Unable to load audit logs. Authentication required.</p>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Entity Type</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        {isLoading ? (
          <TableSkeleton rows={10} cols={4} />
        ) : (
          <TableBody>
            {!data?.results.length ? (
              <TableEmpty colSpan={4} message="No audit logs found." />
            ) : (
              data.results.map((log: AuditLog) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium text-sm">{log.action}</TableCell>
                  <TableCell><Badge variant="secondary">{log.entity_type}</Badge></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.ip_address ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        )}
      </Table>
      {data && (
        <Pagination page={page} totalPages={totalPages} count={data.count}
          onPage={p => { const n = new URLSearchParams(sp); n.set('page', String(p)); setSp(n) }} />
      )}
    </Card>
  )
}
