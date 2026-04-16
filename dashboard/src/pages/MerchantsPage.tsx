import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, ShieldCheck, Star, Trash2, Ban, PauseCircle } from 'lucide-react'
import {
  useMerchants, useMerchantDetail,
  useVerifyMerchant, useUpdateMerchant, useDeleteMerchant,
  useSuspendMerchant, useBanMerchant,
} from '@/hooks/useMerchants'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { MerchantAvatar } from '@/components/shared/MerchantAvatar'
import { MerchantAccountStatusBadge } from '@/components/shared/StatusBadge'
import { StarRating } from '@/components/shared/StarRating'
import { Card } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { MerchantListItem } from '@/types'

export default function MerchantsPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)
  const q = sp.get('q') ?? ''
  const verified = sp.get('verified') ?? ''
  const status = sp.get('status') ?? ''

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'verify' | 'feature' | 'unfeature' | 'suspend' | 'ban' | 'delete'
    id: string
    name: string
  } | null>(null)

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading } = useMerchants({
    page,
    q: q || undefined,
    verified: verified === 'true' ? true : verified === 'false' ? false : '',
    status: (status as 'ACTIVE' | 'SUSPENDED' | 'BANNED') || undefined,
  })

  const { data: detail, isLoading: detailLoading } = useMerchantDetail(selectedId)
  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  const verifyMutation = useVerifyMerchant()
  const updateMutation = useUpdateMerchant()
  const deleteMutation = useDeleteMerchant()
  const suspendMutation = useSuspendMerchant()
  const banMutation = useBanMerchant()

  const isPending =
    verifyMutation.isPending || updateMutation.isPending ||
    deleteMutation.isPending || suspendMutation.isPending || banMutation.isPending

  function handleConfirm() {
    if (!confirmAction) return
    const { type, id } = confirmAction
    const done = () => { setConfirmAction(null); setSelectedId(null) }
    if (type === 'verify') verifyMutation.mutate(id, { onSuccess: done })
    else if (type === 'feature') updateMutation.mutate({ id, payload: { featured: true } }, { onSuccess: done })
    else if (type === 'unfeature') updateMutation.mutate({ id, payload: { featured: false } }, { onSuccess: done })
    else if (type === 'suspend') suspendMutation.mutate(id, { onSuccess: done })
    else if (type === 'ban') banMutation.mutate(id, { onSuccess: done })
    else if (type === 'delete') deleteMutation.mutate(id, { onSuccess: done })
  }

  const actionLabels = {
    verify: 'Verify this merchant?',
    feature: 'Feature this merchant?',
    unfeature: 'Remove from featured?',
    suspend: 'Suspend this merchant?',
    ban: 'Ban this merchant?',
    delete: 'Delete this merchant? This cannot be undone.',
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={v => set('q', v)} placeholder="Search merchants…" className="w-64" />
        <Select value={verified} onChange={e => set('verified', e.target.value)} className="w-40">
          <option value="">All verification</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified</option>
        </Select>
        <Select value={status} onChange={e => set('status', e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </Select>
        {(q || verified || status) && (
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
              <TableHead>Verified</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={8} cols={8} />
          ) : (
            <TableBody>
              {!(data?.results?.length) ? (
                <TableEmpty colSpan={8} />
              ) : (
                (data.results ?? []).map((m: MerchantListItem) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => setSelectedId(m.id)}>
                    <TableCell>
                      <MerchantAvatar logo={m.logo} name={m.display_name} size="sm" />
                    </TableCell>
                    <TableCell className="font-medium">{m.display_name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{m.business_name ?? '—'}</TableCell>
                    <TableCell><StarRating rating={m.rating} total={m.total_reviews} /></TableCell>
                    <TableCell>
                      {m.verified
                        ? <Badge variant="success">Verified</Badge>
                        : <Badge variant="muted">Unverified</Badge>}
                      {m.featured && <Badge variant="warning" className="ml-1">Featured</Badge>}
                    </TableCell>
                    <TableCell><MerchantAccountStatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(m.created_at)}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="View" onClick={() => setSelectedId(m.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!m.verified && (
                          <Button variant="ghost" size="icon" title="Verify"
                            onClick={() => setConfirmAction({ type: 'verify', id: m.id, name: m.display_name })}>
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title={m.featured ? 'Unfeature' : 'Feature'}
                          onClick={() => setConfirmAction({ type: m.featured ? 'unfeature' : 'feature', id: m.id, name: m.display_name })}>
                          <Star className={`h-4 w-4 ${m.featured ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                        {m.status === 'ACTIVE' && (
                          <Button variant="ghost" size="icon" title="Suspend"
                            onClick={() => setConfirmAction({ type: 'suspend', id: m.id, name: m.display_name })}>
                            <PauseCircle className="h-4 w-4 text-orange-500" />
                          </Button>
                        )}
                        {m.status !== 'BANNED' && (
                          <Button variant="ghost" size="icon" title="Ban"
                            onClick={() => setConfirmAction({ type: 'ban', id: m.id, name: m.display_name })}>
                            <Ban className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Delete"
                          onClick={() => setConfirmAction({ type: 'delete', id: m.id, name: m.display_name })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

      {/* Confirm Action Dialog */}
      <Dialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Confirm Action"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm">
            <span className="font-semibold">{confirmAction?.name}</span>
            {' — '}
            {confirmAction ? actionLabels[confirmAction.type] : ''}
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant={confirmAction?.type === 'delete' || confirmAction?.type === 'ban' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? 'Processing…' : 'Confirm'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedId && !confirmAction} onClose={() => setSelectedId(null)} title="Merchant Details" size="lg">
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
                  <MerchantAccountStatusBadge status={detail.status} />
                  {detail.verified && <Badge variant="success">Verified</Badge>}
                  {detail.featured && <Badge variant="warning">Featured</Badge>}
                </div>
                {detail.business_name && <p className="text-sm text-muted-foreground mt-0.5">{detail.business_name}</p>}
                <StarRating rating={detail.rating} total={detail.total_reviews} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {!detail.verified && (
                <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'verify', id: detail.id, name: detail.display_name })}>
                  <ShieldCheck className="h-4 w-4 mr-1" /> Verify
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: detail.featured ? 'unfeature' : 'feature', id: detail.id, name: detail.display_name })}>
                <Star className="h-4 w-4 mr-1" /> {detail.featured ? 'Unfeature' : 'Feature'}
              </Button>
              {detail.status === 'ACTIVE' && (
                <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'suspend', id: detail.id, name: detail.display_name })}>
                  <PauseCircle className="h-4 w-4 mr-1" /> Suspend
                </Button>
              )}
              {detail.status !== 'BANNED' && (
                <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'ban', id: detail.id, name: detail.display_name })}>
                  <Ban className="h-4 w-4 mr-1" /> Ban
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => setConfirmAction({ type: 'delete', id: detail.id, name: detail.display_name })}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'User Email', value: detail.user_email },
                { label: 'Business Email', value: detail.business_email ?? '—' },
                { label: 'Phone', value: detail.business_phone ?? '—' },
                { label: 'User', value: detail.user_name },
                { label: 'Verified On', value: formatDate(detail.verification_date) },
                { label: 'Created', value: formatDateTime(detail.created_at) },
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
