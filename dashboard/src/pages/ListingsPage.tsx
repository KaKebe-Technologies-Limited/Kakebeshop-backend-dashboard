import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Star, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useListings, useListingMutations } from '@/hooks/useListings'
import { useCategories } from '@/hooks/useCategories'
import { ListingDetailDialog } from '@/components/listings/ListingDetailDialog'
import { CreateListingDialog } from '@/components/listings/CreateListingDialog'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ListingTypeBadge } from '@/components/shared/StatusBadge'
import { formatPriceRange, formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import type { Listing } from '@/types'

export default function ListingsPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)
  const search = sp.get('search') ?? ''
  const type = sp.get('type') ?? ''
  const status = sp.get('status') ?? ''
  const category = sp.get('category') ?? ''

  const [detailId, setDetailId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [quickAction, setQuickAction] = useState<{ type: 'approve' | 'reject' | 'feature' | 'delete'; listing: Listing } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { toast } = useToast()

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading } = useListings({
    page,
    q: search || undefined,
    listing_type: type as 'PRODUCT' | 'SERVICE' | '',
    status: status || undefined,
    category_id: category || undefined,
    ordering: '-created_at',
  })

  const { data: catData } = useCategories({ page: 1 })
  const { approveListing, rejectListing, featureListing, deleteListing, isApproving, isRejecting, isFeaturing, isDeleting } = useListingMutations()
  const isPending = isApproving || isRejecting || isFeaturing || isDeleting
  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  const handleQuickAction = async () => {
    if (!quickAction) return
    const { type, listing } = quickAction
    try {
      if (type === 'approve') { await approveListing(listing.id); toast({ title: 'Listing approved' }) }
      else if (type === 'reject') { await rejectListing({ id: listing.id, reason: rejectReason || undefined }); toast({ title: 'Listing rejected' }) }
      else if (type === 'feature') { await featureListing(listing.id); toast({ title: listing.is_featured ? 'Unfeatured' : 'Featured' }) }
      else if (type === 'delete') { await deleteListing(listing.id); toast({ title: 'Listing deleted' }) }
      setQuickAction(null)
    } catch {
      toast({ variant: 'destructive', title: 'Action failed' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={search} onChange={v => set('search', v)} placeholder="Search listings..." className="w-64" />
          <Select value={type} onChange={e => set('type', e.target.value)} className="w-36">
            <option value="">All types</option>
            <option value="PRODUCT">Products</option>
            <option value="SERVICE">Services</option>
          </Select>
          <Select value={status} onChange={e => set('status', e.target.value)} className="w-40">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </Select>
          <Select value={category} onChange={e => set('category', e.target.value)} className="w-44">
            <option value="">All categories</option>
            {catData?.results.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {(search || type || status || category) && (
            <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
          )}
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Listing
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Title</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-44">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={10} cols={9} />
          ) : (
            <TableBody>
              {!(data?.results?.length) ? (
                <TableEmpty colSpan={9} />
              ) : (
                (data.results ?? []).map((l: Listing) => (
                  <TableRow
                    key={l.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setDetailId(l.id)}
                  >
                    <TableCell>
                      {l.primary_image
                        ? <img src={l.primary_image.image} alt="" className="h-9 w-9 rounded object-cover" />
                        : <div className="h-9 w-9 rounded bg-muted" />}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium max-w-[160px] truncate">{l.title}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{l.merchant_name}</TableCell>
                    <TableCell><ListingTypeBadge type={l.listing_type} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.category_name}</TableCell>
                    <TableCell className="text-xs font-medium">
                      {formatPriceRange(l.price_type, l.price, l.price_min, l.price_max)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {l.is_verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>}
                        {l.is_featured && <Badge variant="info">Featured</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(l.created_at)}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {!l.is_verified && (
                          <Button variant="ghost" size="icon" title="Approve" onClick={() => setQuickAction({ type: 'approve', listing: l })}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {l.is_verified && (
                          <Button variant="ghost" size="icon" title="Reject" onClick={() => setQuickAction({ type: 'reject', listing: l })}>
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title={l.is_featured ? 'Unfeature' : 'Feature'} onClick={() => setQuickAction({ type: 'feature', listing: l })}>
                          <Star className={`h-4 w-4 ${l.is_featured ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => setQuickAction({ type: 'delete', listing: l })}>
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

      {/* Detail Dialog — full details + images + edit */}
      <ListingDetailDialog
        listingId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
        categories={catData?.results ?? []}
      />

      {/* Create Dialog */}
      <CreateListingDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        categories={catData?.results ?? []}
      />

      {/* Quick action confirm */}
      <Dialog
        open={!!quickAction && quickAction.type !== 'reject'}
        onClose={() => setQuickAction(null)}
        title="Confirm Action"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm">
            {quickAction?.type === 'approve' && <>Approve <span className="font-semibold">{quickAction.listing.title}</span>?</>}
            {quickAction?.type === 'feature' && <>{quickAction.listing.is_featured ? 'Unfeature' : 'Feature'} <span className="font-semibold">{quickAction.listing.title}</span>?</>}
            {quickAction?.type === 'delete' && <>Permanently delete <span className="font-semibold">{quickAction.listing.title}</span>?</>}
          </p>
          <div className="flex gap-3">
            <Button className="flex-1" variant={quickAction?.type === 'delete' ? 'destructive' : 'default'} onClick={() => void handleQuickAction()} disabled={isPending}>
              {isPending ? 'Processing...' : 'Confirm'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setQuickAction(null)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Quick reject */}
      <Dialog open={quickAction?.type === 'reject'} onClose={() => setQuickAction(null)} title="Reject Listing" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm">Rejecting <span className="font-semibold">{quickAction?.listing.title}</span></p>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="mt-1" placeholder="Reason for rejection..." />
          </div>
          <div className="flex gap-3">
            <Button variant="destructive" className="flex-1" onClick={() => void handleQuickAction()} disabled={isPending}>
              {isPending ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setQuickAction(null)}>Cancel</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
