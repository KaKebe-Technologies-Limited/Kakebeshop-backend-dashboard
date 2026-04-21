import { useState } from 'react'
import { useListingDetail, useListingMutations } from '@/hooks/useListings'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CloudinaryUploader } from '@/components/shared/CloudinaryUploader'
import { ListingTypeBadge } from '@/components/shared/StatusBadge'
import { formatPriceRange, formatDateTime } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, XCircle, Star, Trash2, Pencil, X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Category } from '@/types'

interface ListingDetailDialogProps {
  listingId: string | null
  open: boolean
  onClose: () => void
  categories: Category[]
}

function ImageGallery({ images }: { images: Array<{ id: string; image: string; variant?: string }> }) {
  const [current, setCurrent] = useState(0)

  if (!images.length) return (
    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
      No images
    </div>
  )

  return (
    <div className="space-y-2">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <img src={images[current].image} alt="" className="h-full w-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent(i => Math.max(0, i - 1))}
              disabled={current === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 disabled:opacity-30 hover:bg-black/70"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrent(i => Math.min(images.length - 1, i + 1))}
              disabled={current === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 disabled:opacity-30 hover:bg-black/70"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {current + 1} / {images.length}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 h-14 w-14 rounded-md overflow-hidden border-2 transition-colors ${i === current ? 'border-primary' : 'border-transparent'}`}
            >
              <img src={img.image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ListingDetailDialog({ listingId, open, onClose, categories }: ListingDetailDialogProps) {
  const { data: listing, isLoading } = useListingDetail(listingId)
  const {
    updateListing, approveListing, rejectListing, featureListing, deleteListing,
    isUpdating, isApproving, isRejecting, isFeaturing, isDeleting,
  } = useListingMutations()
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'feature' | 'delete' | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPriceType, setEditPriceType] = useState('FIXED')
  const [editPrice, setEditPrice] = useState('')
  const [editPriceMin, setEditPriceMin] = useState('')
  const [editPriceMax, setEditPriceMax] = useState('')
  const [editCurrency, setEditCurrency] = useState('UGX')
  const [editStatus, setEditStatus] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])

  const isPending = isUpdating || isApproving || isRejecting || isFeaturing || isDeleting

  const openEdit = () => {
    if (!listing) return
    const raw = listing as unknown as Record<string, unknown>
    setEditTitle(listing.title)
    setEditDescription(String(raw.description ?? ''))
    setEditCategory(listing.category ?? '')
    setEditPriceType(listing.price_type ?? 'FIXED')
    setEditPrice(listing.price ?? '')
    setEditPriceMin(listing.price_min ?? '')
    setEditPriceMax(listing.price_max ?? '')
    setEditCurrency(listing.currency ?? 'UGX')
    setEditStatus(listing.status ?? '')
    const imgs = Array.isArray(raw.images)
      ? (raw.images as Array<{ image: string }>).map(i => i.image)
      : listing.primary_image ? [listing.primary_image.image] : []
    setEditImages(imgs)
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!listing) return
    try {
      await updateListing({
        id: listing.id,
        data: {
          title: editTitle,
          description: editDescription,
          category: editCategory || undefined,
          price_type: editPriceType,
          price: editPriceType === 'FIXED' ? editPrice || null : null,
          price_min: editPriceType === 'RANGE' ? editPriceMin || null : null,
          price_max: editPriceType === 'RANGE' ? editPriceMax || null : null,
          currency: editCurrency,
          status: editStatus,
        },
      })
      toast({ title: 'Listing updated' })
      setEditing(false)
    } catch {
      toast({ variant: 'destructive', title: 'Update failed' })
    }
  }

  const handleAction = async () => {
    if (!listing || !confirmAction) return
    try {
      if (confirmAction === 'approve') { await approveListing(listing.id); toast({ title: 'Listing approved' }) }
      else if (confirmAction === 'reject') { await rejectListing({ id: listing.id, reason: rejectReason || undefined }); toast({ title: 'Listing rejected' }) }
      else if (confirmAction === 'feature') { await featureListing(listing.id); toast({ title: listing.is_featured ? 'Listing unfeatured' : 'Listing featured' }) }
      else if (confirmAction === 'delete') { await deleteListing(listing.id); toast({ title: 'Listing deleted' }); onClose() }
      setConfirmAction(null)
    } catch {
      toast({ variant: 'destructive', title: 'Action failed' })
    }
  }

  const allImages = (() => {
    if (!listing) return []
    const raw = listing as unknown as Record<string, unknown>
    if (Array.isArray(raw.images)) return raw.images as Array<{ id: string; image: string; variant: string }>
    if (listing.primary_image) return [{ id: listing.primary_image.id, image: listing.primary_image.image, variant: 'primary' }]
    return []
  })()

  if (!open) return null

  return (
    <>
      <Dialog open={open && !confirmAction && !editing} onClose={onClose} title="Listing Details" size="lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : listing ? (
          <div className="p-6 space-y-5">
            <ImageGallery images={allImages} />

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">{listing.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{listing.merchant_name}</p>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {listing.is_verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>}
                {listing.is_featured && <Badge variant="info">Featured</Badge>}
                <ListingTypeBadge type={listing.listing_type} />
              </div>
            </div>

            {(listing as unknown as Record<string, string>).description && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</p>
                <p className="text-sm leading-relaxed">{(listing as unknown as Record<string, string>).description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Category', value: listing.category_name },
                { label: 'Price', value: formatPriceRange(listing.price_type, listing.price, listing.price_min, listing.price_max) },
                { label: 'Currency', value: listing.currency },
                { label: 'Status', value: listing.status },
                { label: 'Views', value: (listing.views_count ?? 0).toLocaleString() },
                { label: 'Contacts', value: (listing.contact_count ?? 0).toLocaleString() },
                { label: 'Created', value: formatDateTime(listing.created_at) },
                { label: 'Updated', value: formatDateTime(listing.updated_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <p className="mt-0.5 font-medium">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="outline" onClick={openEdit}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              {!listing.is_verified && (
                <Button size="sm" variant="outline" onClick={() => setConfirmAction('approve')}>
                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" /> Approve
                </Button>
              )}
              {listing.is_verified && (
                <Button size="sm" variant="outline" onClick={() => setConfirmAction('reject')}>
                  <XCircle className="h-4 w-4 mr-1 text-red-500" /> Reject
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setConfirmAction('feature')}>
                <Star className={`h-4 w-4 mr-1 ${listing.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {listing.is_featured ? 'Unfeature' : 'Feature'}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmAction('delete')}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editing} onClose={() => setEditing(false)} title="Edit Listing" size="lg">
        <div className="p-6 space-y-4">
          <div>
            <Label>Title</Label>
            <Input className="mt-1" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea className="mt-1" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select className="mt-1" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                <option value="">Keep current</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select className="mt-1" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price Type</Label>
              <Select className="mt-1" value={editPriceType} onChange={e => setEditPriceType(e.target.value)}>
                <option value="FIXED">Fixed</option>
                <option value="RANGE">Range</option>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select className="mt-1" value={editCurrency} onChange={e => setEditCurrency(e.target.value)}>
                <option value="UGX">UGX</option>
                <option value="USD">USD</option>
                <option value="KES">KES</option>
              </Select>
            </div>
          </div>
          {editPriceType === 'FIXED' ? (
            <div>
              <Label>Price</Label>
              <Input className="mt-1" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="0.00" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Price</Label>
                <Input className="mt-1" value={editPriceMin} onChange={e => setEditPriceMin(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Max Price</Label>
                <Input className="mt-1" value={editPriceMax} onChange={e => setEditPriceMax(e.target.value)} placeholder="0.00" />
              </div>
            </div>
          )}

          <div>
            <Label>Images</Label>
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-2">
                {editImages.map((url, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border group">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setEditImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <CloudinaryUploader
                onUpload={url => setEditImages(prev => [...prev, url])}
                folder="listings"
                buttonText="Add Image"
                variant="outline"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={() => void saveEdit()} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmAction && confirmAction !== 'reject'} onClose={() => setConfirmAction(null)} title="Confirm Action" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm">
            {confirmAction === 'approve' && <>Approve <span className="font-semibold">{listing?.title}</span>?</>}
            {confirmAction === 'feature' && <>{listing?.is_featured ? 'Unfeature' : 'Feature'} <span className="font-semibold">{listing?.title}</span>?</>}
            {confirmAction === 'delete' && <>Permanently delete <span className="font-semibold">{listing?.title}</span>?</>}
          </p>
          <div className="flex gap-3">
            <Button className="flex-1" variant={confirmAction === 'delete' ? 'destructive' : 'default'} onClick={() => void handleAction()} disabled={isPending}>
              {isPending ? 'Processing...' : 'Confirm'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={confirmAction === 'reject'} onClose={() => setConfirmAction(null)} title="Reject Listing" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm">Rejecting <span className="font-semibold">{listing?.title}</span></p>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="mt-1" placeholder="Reason for rejection..." />
          </div>
          <div className="flex gap-3">
            <Button variant="destructive" className="flex-1" onClick={() => void handleAction()} disabled={isPending}>
              {isPending ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)}>Cancel</Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
