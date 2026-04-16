import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Star, Trash2, Eye } from 'lucide-react'
import { useListings, useListingMutations } from '@/hooks/useListings'
import { useCategories } from '@/hooks/useCategories'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ListingTypeBadge } from '@/components/shared/StatusBadge'
import { formatPriceRange, formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import type { Listing } from '@/types'

type ActionType = 'approve' | 'reject' | 'feature' | 'delete' | 'edit'

export default function ListingsPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)
  const search = sp.get('search') ?? ''
  const type = sp.get('type') ?? ''
  const status = sp.get('status') ?? ''
  const category = sp.get('category') ?? ''

  const [action, setAction] = useState<{ type: ActionType; listing: Listing } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editPriceMin, setEditPriceMin] = useState('')
  const [editPriceMax, setEditPriceMax] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)

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
  const {
    updateListing, deleteListing, approveListing, rejectListing, featureListing,
    isUpdating, isDeleting, isApproving, isRejecting, isFeaturing,
  } = useListingMutations()

  const isPending = isUpdating || isDeleting || isApproving || isRejecting || isFeaturing
  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  const openAction = (type: ActionType, listing: Listing) => {
    setAction({ type, listing })
    if (type === 'edit') {
      setEditTitle(listing.title)
      setEditCategory(listing.category ?? '')
      setEditPrice(listing.price ?? '')
      setEditPriceMin(listing.price_min ?? '')
      setEditPriceMax(listing.price_max ?? '')
      setEditFeatured(listing.is_featured)
    }
    if (type === 'reject') setRejectReason('')
  }

  const closeAction = () => {
    setAction(null)
    setRejectReason('')
  }

  const getErrorMessage = (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const d = (error as { response?: { data?: unknown } }).response?.data
      if (typeof d === 'string') return d
      if (typeof d === 'object' && d !== null) {
        const first = Object.values(d as Record<string, unknown>)[0]
        if (Array.isArray(first) && first.length > 0) return String(first[0])
      }
    }
    return 'Request failed.'
  }

  const handleConfirm = async () => {
    if (!action) return
    const { type, listing } = action
    try {
      if (type === 'approve') {
        await approveListing(listing.id)
        toast({ title: 'Listing approved' })
      } else if (type === 'reject') {
        await rejectListing({ id: listing.id, reason: rejectReason || undefined })
        toast({ title: 'Listing rejected' })
      } else if (type === 'feature') {
        await featureListing(listing.id)
        toast({ title: listing.is_featured ? 'Listing unfeatured' : 'Listing featured' })
      } else if (type === 'delete') {
        await deleteListing(listing.id)
        toast({ title: 'Listing deleted' })
      } else if (type === 'edit') {
        const payload: Record<string, unknown> = {}
        if (editTitle.trim() !== listing.title) payload.title = editTitle.trim()
        if (editCategory && editCategory !== listing.category) payload.category = editCategory
        if (editFeatured !== listing.is_featured) payload.is_featured = editFeatured
        if ((listing.price ?? '') !== editPrice) payload.price = editPrice || null
        if ((listing.price_min ?? '') !== editPriceMin) payload.price_min = editPriceMin || null
        if ((listing.price_max ?? '') !== editPriceMax) payload.price_max = editPriceMax || null
        if (Object.keys(payload).length === 0) { toast({ title: 'No changes' }); closeAction(); return }
        await updateListing({ id: listing.id, data: payload })
        toast({ title: 'Listing updated' })
      }
      closeAction()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action failed', description: getErrorMessage(e) })
    }
  }

  const canSaveEdit = useMemo(() => !!editTitle.trim(), [editTitle])

  return (
    <div className="space-y-4">
      {/* Filters */}
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
          {catData?.results.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        {(search || type || status || category) && (
          <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
        )}
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
              <TableHead className="w-48">Actions</TableHead>
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
                  <TableRow key={l.id}>
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
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openAction('edit', l)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!l.is_verified && (
                          <Button variant="ghost" size="icon" title="Approve" onClick={() => openAction('approve', l)}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {l.is_verified && (
                          <Button variant="ghost" size="icon" title="Reject" onClick={() => openAction('reject', l)}>
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title={l.is_featured ? 'Unfeature' : 'Feature'} onClick={() => openAction('feature', l)}>
                          <Star className={`h-4 w-4 ${l.is_featured ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => openAction('delete', l)}>
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

      {/* Edit Dialog */}
      <Dialog open={action?.type === 'edit'} onClose={closeAction} title="Edit Listing" size="lg">
        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="listing-title">Title</Label>
            <Input id="listing-title" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="listing-category">Category</Label>
            <Select id="listing-category" value={editCategory} onChange={e => setEditCategory(e.target.value)} className="mt-1">
              <option value="">Keep current</option>
              {catData?.results.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Price</Label>
              <Input value={editPrice} onChange={e => setEditPrice(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Min Price</Label>
              <Input value={editPriceMin} onChange={e => setEditPriceMin(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Max Price</Label>
              <Input value={editPriceMax} onChange={e => setEditPriceMax(e.target.value)} className="mt-1" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editFeatured} onChange={e => setEditFeatured(e.target.checked)} />
            Featured listing
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeAction}>Cancel</Button>
            <Button onClick={() => void handleConfirm()} disabled={!canSaveEdit || isPending}>
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={action?.type === 'reject'} onClose={closeAction} title="Reject Listing" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm">Rejecting <span className="font-semibold">{action?.listing.title}</span></p>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="mt-1" placeholder="Reason for rejection..." />
          </div>
          <div className="flex gap-3">
            <Button variant="destructive" className="flex-1" onClick={() => void handleConfirm()} disabled={isPending}>
              {isPending ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={closeAction}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm Dialog (approve / feature / delete) */}
      <Dialog
        open={action?.type === 'approve' || action?.type === 'feature' || action?.type === 'delete'}
        onClose={closeAction}
        title="Confirm Action"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm">
            {action?.type === 'approve' && <>Approve <span className="font-semibold">{action.listing.title}</span>?</>}
            {action?.type === 'feature' && <>{action.listing.is_featured ? 'Unfeature' : 'Feature'} <span className="font-semibold">{action.listing.title}</span>?</>}
            {action?.type === 'delete' && <>Permanently delete <span className="font-semibold">{action.listing.title}</span>?</>}
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant={action?.type === 'delete' ? 'destructive' : 'default'}
              onClick={() => void handleConfirm()}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : 'Confirm'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={closeAction}>Cancel</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
