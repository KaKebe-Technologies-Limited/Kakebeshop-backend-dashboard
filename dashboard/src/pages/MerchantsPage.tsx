import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useMerchants, useMerchantDetail } from '@/hooks/useMerchants'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { MerchantAvatar } from '@/components/shared/MerchantAvatar'
import { MerchantStatusBadge, ActiveBadge } from '@/components/shared/StatusBadge'
import { StarRating } from '@/components/shared/StarRating'
import { Card } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { MerchantListItem } from '@/types'

export default function MerchantsPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)
  const search = sp.get('search') ?? ''
  const verified = sp.get('verified') ?? ''
  const featured = sp.get('featured') ?? ''

  const [selectedId, setSelectedId] = useState<string | null>(null)

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading } = useMerchants({
    page,
    search: search || undefined,
    verified: verified === 'true' ? true : verified === 'false' ? false : '',
    featured: featured === 'true' ? true : '',
  })

  const { data: detail, isLoading: detailLoading } = useMerchantDetail(selectedId)
  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={v => set('search', v)} placeholder="Search merchants…" className="w-64" />
        <Select value={verified} onChange={e => set('verified', e.target.value)} className="w-40">
          <option value="">All verification</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified</option>
        </Select>
        <Select value={featured} onChange={e => set('featured', e.target.value)} className="w-40">
          <option value="">All merchants</option>
          <option value="true">Featured only</option>
        </Select>
        {(search || verified || featured) && (
          <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear filters</Button>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Merchant</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <TableBody>
              {!(data?.results?.length) ? (
                <TableEmpty colSpan={7} />
              ) : (
                (data.results ?? []).map((m: MerchantListItem) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => setSelectedId(m.id)}>
                    <TableCell>
                      <MerchantAvatar logo={m.logo} name={m.display_name} size="sm" />
                    </TableCell>
                    <TableCell className="font-medium">{m.display_name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{m.business_name ?? '—'}</TableCell>
                    <TableCell><StarRating rating={m.rating} total={m.total_reviews} /></TableCell>
                    <TableCell><MerchantStatusBadge verified={m.verified} featured={m.featured} /></TableCell>
                    <TableCell className="text-muted-foreground text-xs">—</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedId(m.id) }}>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedId} onClose={() => setSelectedId(null)} title="Merchant Details" size="lg">
        {detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex gap-4 items-start">
              <MerchantAvatar logo={detail.logo} name={detail.display_name} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold">{detail.display_name}</h2>
                  <ActiveBadge active={detail.is_active} />
                  {detail.verified && <Badge variant="success">Verified</Badge>}
                  {detail.featured && <Badge variant="warning">Featured</Badge>}
                </div>
                {detail.business_name && <p className="text-sm text-muted-foreground mt-0.5">{detail.business_name}</p>}
                <StarRating rating={detail.rating} total={detail.total_reviews} />
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Email', value: detail.email },
                { label: 'Business Email', value: detail.business_email ?? '—' },
                { label: 'Phone', value: detail.business_phone ?? '—' },
                { label: 'Username', value: detail.username },
                { label: 'Status', value: detail.status },
                { label: 'Verified On', value: formatDate(detail.verification_date) },
                { label: 'Created', value: formatDateTime(detail.created_at) },
                { label: 'Updated', value: formatDateTime(detail.updated_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <p className="mt-0.5 text-foreground font-medium truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Location */}
            {detail.location && (
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Location</p>
                <p className="text-sm font-medium">{detail.location.region}, {detail.location.district}</p>
                <p className="text-xs text-muted-foreground">{detail.location.area}</p>
                {detail.location.address && <p className="text-xs text-muted-foreground mt-0.5">{detail.location.address}</p>}
              </div>
            )}

            {/* Description */}
            {detail.description && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">About</p>
                <p className="text-sm text-foreground leading-relaxed">{detail.description}</p>
              </div>
            )}
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
