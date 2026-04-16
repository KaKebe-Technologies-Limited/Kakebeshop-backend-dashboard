import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useListings, useListingMutations } from '@/hooks/useListings'
import { useCategories } from '@/hooks/useCategories'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ListingTypeBadge } from '@/components/shared/StatusBadge'
import { MerchantAvatar } from '@/components/shared/MerchantAvatar'
import { Badge } from '@/components/ui/badge'
import { formatPriceRange, formatDate } from '@/lib/utils'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import type { Listing } from '@/types'

export default function ListingsPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)
  const search = sp.get('search') ?? ''
  const type = sp.get('type') ?? ''
  const featured = sp.get('featured') ?? ''
  const category = sp.get('category') ?? ''

  const [editing, setEditing] = useState<Listing | null>(null)
  const [deleting, setDeleting] = useState<Listing | null>(null)
  const [title, setTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [price, setPrice] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [isFeaturedEdit, setIsFeaturedEdit] = useState(false)

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
    is_verified: featured === 'true' ? true : '',
    category_id: category || undefined,
    ordering: '-created_at',
  })

  const { data: catData } = useCategories({ page: 1 })
  const { updateListing, deleteListing, isUpdating, isDeleting } = useListingMutations()
  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  const canSave = useMemo(() => !!editing && !!title.trim(), [editing, title])

  const openEditor = (listing: Listing) => {
    setEditing(listing)
    setTitle(listing.title)
    const selectedCategory = catData?.results.find(c => c.name === listing.category_name)
    setEditCategory(selectedCategory?.id ?? '')
    setPrice(listing.price ?? '')
    setPriceMin(listing.price_min ?? '')
    setPriceMax(listing.price_max ?? '')
    setIsFeaturedEdit(listing.is_featured)
  }

  const closeEditor = () => {
    setEditing(null)
    setTitle('')
    setEditCategory('')
    setPrice('')
    setPriceMin('')
    setPriceMax('')
    setIsFeaturedEdit(false)
  }

  const getErrorMessage = (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const responseData = (error as { response?: { data?: unknown } }).response?.data
      if (typeof responseData === 'string') return responseData
      if (typeof responseData === 'object' && responseData !== null) {
        const first = Object.values(responseData as Record<string, unknown>)[0]
        if (Array.isArray(first) && first.length > 0) return String(first[0])
      }
    }
    return 'Request failed. Check API permissions and payload fields.'
  }

  const saveListing = async () => {
    if (!editing || !canSave) return

    const payload: Record<string, unknown> = {}

    if (title.trim() !== editing.title) payload.title = title.trim()
    if (editCategory) payload.category = editCategory
    if (isFeaturedEdit !== editing.is_featured) payload.is_featured = isFeaturedEdit

    if ((editing.price ?? '') !== price) payload.price = price || null
    if ((editing.price_min ?? '') !== priceMin) payload.price_min = priceMin || null
    if ((editing.price_max ?? '') !== priceMax) payload.price_max = priceMax || null

    if (Object.keys(payload).length === 0) {
      toast({ title: 'No changes', description: 'Nothing to update for this listing.' })
      closeEditor()
      return
    }

    try {
      await updateListing({ id: editing.id, data: payload })
      toast({ title: 'Listing updated', description: 'Changes were saved to the backend.' })
      closeEditor()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: getErrorMessage(error),
      })
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return

    try {
      await deleteListing(deleting.id)
      toast({ title: 'Listing deleted', description: 'Listing was removed successfully.' })
      setDeleting(null)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={v => set('search', v)} placeholder="Search listings..." className="w-64" />
        <Select value={type} onChange={e => set('type', e.target.value)} className="w-36">
          <option value="">All types</option>
          <option value="PRODUCT">Products</option>
          <option value="SERVICE">Services</option>
        </Select>
        <Select value={featured} onChange={e => set('featured', e.target.value)} className="w-40">
          <option value="">All listings</option>
          <option value="true">Featured only</option>
        </Select>
        <Select value={category} onChange={e => set('category', e.target.value)} className="w-44">
          <option value="">All categories</option>
          {catData?.results.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        {(search || type || featured || category) && (
          <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
        )}
      </div>

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
              <TableHead>Views</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={10} cols={10} />
          ) : (
            <TableBody>
              {!(data?.results?.length) ? (
                <TableEmpty colSpan={10} />
              ) : (
                (data.results ?? []).map((l: Listing) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      {l.primary_image ? (
                        <img src={l.primary_image.image} alt="" className="h-9 w-9 rounded object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium max-w-[180px] truncate">{l.title}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MerchantAvatar logo={l.merchant.logo} name={l.merchant.display_name} size="sm" />
                        <span className="text-xs truncate max-w-[100px]">{l.merchant.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell><ListingTypeBadge type={l.listing_type} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.category_name}</TableCell>
                    <TableCell className="text-xs font-medium">
                      {formatPriceRange(l.price_type, l.price, l.price_min, l.price_max)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{(l.views_count ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {l.is_verified && <Badge variant="success">Verified</Badge>}
                        {l.is_featured && <Badge variant="warning">Featured</Badge>}
                        {!l.is_verified && !l.is_featured && <Badge variant="muted">-</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(l.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditor(l)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleting(l)}>Delete</Button>
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

      <Dialog open={!!editing} onClose={closeEditor} title="Edit Listing" size="lg">
        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="listing-title">Title</Label>
            <Input id="listing-title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="listing-category">Category</Label>
            <Select id="listing-category" value={editCategory} onChange={e => setEditCategory(e.target.value)} className="mt-1">
              <option value="">Keep current</option>
              {catData?.results.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" value={price} onChange={e => setPrice(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="price-min">Min Price</Label>
              <Input id="price-min" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="price-max">Max Price</Label>
              <Input id="price-max" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="mt-1" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFeaturedEdit} onChange={e => setIsFeaturedEdit(e.target.checked)} />
            Featured listing
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeEditor}>Cancel</Button>
            <Button onClick={() => void saveListing()} disabled={!canSave || isUpdating}>
              {isUpdating ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete Listing">
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            This will permanently delete <span className="font-medium text-foreground">{deleting?.title}</span>.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void confirmDelete()} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
