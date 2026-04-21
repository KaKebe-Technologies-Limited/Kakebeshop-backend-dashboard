import { useState } from 'react'
import { useListingMutations } from '@/hooks/useListings'
import { fetchMerchants } from '@/api/merchants'
import { useQuery } from '@tanstack/react-query'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CloudinaryUploader } from '@/components/shared/CloudinaryUploader'
import { useToast } from '@/components/ui/use-toast'
import { X } from 'lucide-react'
import type { Category } from '@/types'

interface CreateListingDialogProps {
  open: boolean
  onClose: () => void
  categories: Category[]
}

export function CreateListingDialog({ open, onClose, categories }: CreateListingDialogProps) {
  const { createListing, isCreating } = useListingMutations()
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [listingType, setListingType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT')
  const [category, setCategory] = useState('')
  const [priceType, setPriceType] = useState<'FIXED' | 'RANGE'>('FIXED')
  const [price, setPrice] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [currency, setCurrency] = useState('UGX')
  const [isNegotiable, setIsNegotiable] = useState(false)
  const [images, setImages] = useState<string[]>([])

  const { data: merchantsData } = useQuery({
    queryKey: ['merchants-for-listing'],
    queryFn: () => fetchMerchants({ page: 1, status: 'ACTIVE' }),
    enabled: open,
    staleTime: 60_000,
  })

  const reset = () => {
    setTitle(''); setDescription(''); setMerchantId(''); setListingType('PRODUCT')
    setCategory(''); setPriceType('FIXED'); setPrice(''); setPriceMin('')
    setPriceMax(''); setCurrency('UGX'); setIsNegotiable(false); setImages([])
  }

  const handleClose = () => { reset(); onClose() }

  const handleCreate = async () => {
    if (!title.trim() || !merchantId || !category) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Title, merchant and category are required.' })
      return
    }
    try {
      await createListing({
        merchant: merchantId,
        title: title.trim(),
        description: description.trim() || undefined,
        listing_type: listingType,
        category,
        price_type: priceType,
        price: priceType === 'FIXED' ? price || null : null,
        price_min: priceType === 'RANGE' ? priceMin || null : null,
        price_max: priceType === 'RANGE' ? priceMax || null : null,
        currency,
        is_price_negotiable: isNegotiable,
        status: 'PENDING',
      })
      toast({ title: 'Listing created', description: 'Listing created and set to Pending review.' })
      handleClose()
    } catch (e) {
      const err = e as { response?: { data?: Record<string, unknown> } }
      const d = err?.response?.data
      const msg = d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(', ') : 'Create failed'
      toast({ variant: 'destructive', title: 'Create failed', description: msg })
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Create Listing" size="lg">
      <div className="p-6 space-y-4">
        {/* Merchant */}
        <div>
          <Label>Merchant <span className="text-destructive">*</span></Label>
          <Select className="mt-1" value={merchantId} onChange={e => setMerchantId(e.target.value)}>
            <option value="">Select merchant...</option>
            {(merchantsData?.results ?? []).map(m => (
              <option key={m.id} value={m.id}>{m.display_name}{m.business_name ? ` — ${m.business_name}` : ''}</option>
            ))}
          </Select>
        </div>

        {/* Title */}
        <div>
          <Label>Title <span className="text-destructive">*</span></Label>
          <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Fresh Tomatoes" />
        </div>

        {/* Description */}
        <div>
          <Label>Description</Label>
          <Textarea className="mt-1" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the product or service..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <Label>Listing Type</Label>
            <Select className="mt-1" value={listingType} onChange={e => setListingType(e.target.value as 'PRODUCT' | 'SERVICE')}>
              <option value="PRODUCT">Product</option>
              <option value="SERVICE">Service</option>
            </Select>
          </div>
          {/* Category */}
          <div>
            <Label>Category <span className="text-destructive">*</span></Label>
            <Select className="mt-1" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Price Type */}
          <div>
            <Label>Price Type</Label>
            <Select className="mt-1" value={priceType} onChange={e => setPriceType(e.target.value as 'FIXED' | 'RANGE')}>
              <option value="FIXED">Fixed</option>
              <option value="RANGE">Range</option>
            </Select>
          </div>
          {/* Currency */}
          <div>
            <Label>Currency</Label>
            <Select className="mt-1" value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="UGX">UGX</option>
              <option value="USD">USD</option>
              <option value="KES">KES</option>
            </Select>
          </div>
        </div>

        {/* Price fields */}
        {priceType === 'FIXED' ? (
          <div>
            <Label>Price</Label>
            <Input className="mt-1" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min Price</Label>
              <Input className="mt-1" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Max Price</Label>
              <Input className="mt-1" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="0.00" />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isNegotiable} onChange={e => setIsNegotiable(e.target.checked)} />
          Price is negotiable
        </label>

        {/* Images */}
        <div>
          <Label>Images</Label>
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <CloudinaryUploader
              onUpload={url => setImages(prev => [...prev, url])}
              folder="listings"
              buttonText="Add Image"
              variant="outline"
            />
            <p className="text-xs text-muted-foreground">Images are uploaded to Cloudinary. The listing is created first, then images can be linked via the merchant portal.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={() => void handleCreate()} disabled={isCreating || !title.trim() || !merchantId || !category}>
            {isCreating ? 'Creating...' : 'Create Listing'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
