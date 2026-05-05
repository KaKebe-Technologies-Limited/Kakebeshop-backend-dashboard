import { useState } from 'react'
import { useBanners, useBannerMutations } from '@/hooks/useReports'
import { verifyBanner, unverifyBanner } from '@/api/reports'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { CloudinaryUploader } from '@/components/shared/CloudinaryUploader'
import { formatDate } from '@/lib/utils'
import { queryKeys } from '@/lib/queryKeys'
import { useToast } from '@/components/ui/use-toast'
import { Eye, MousePointer, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Banner } from '@/types'

const placements = ['HOME_TOP', 'HOME_MIDDLE', 'CATEGORY_TOP', 'SEARCH_TOP'] as const
const displayTypes = ['BANNER', 'CAROUSEL', 'AD'] as const
const linkTypes = ['NONE', 'URL', 'CATEGORY', 'LISTING', 'LISTINGS'] as const

type Placement = typeof placements[number]
type DisplayType = typeof displayTypes[number]
type LinkType = typeof linkTypes[number]

export interface BannerFormState {
  title: string
  image: string
  mobileImage: string
  linkUrl: string
  placement: Placement
  displayType: DisplayType
  linkType: LinkType
  ctaText: string
  startDate: string
  endDate: string
  sortOrder: number
  isActive: boolean
}

export const defaultForm: BannerFormState = {
  title: '',
  image: '',
  mobileImage: '',
  linkUrl: '',
  placement: 'CATEGORY_TOP',
  displayType: 'BANNER',
  linkType: 'NONE',
  ctaText: '',
  startDate: '',
  endDate: '',
  sortOrder: 0,
  isActive: true,
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: unknown } }).response
    const status = response?.status
    const d = response?.data
    if (typeof d === 'string') return `${status}: ${d}`
    if (typeof d === 'object' && d !== null) {
      const detail = (d as Record<string, unknown>).detail ?? (d as Record<string, unknown>).error ?? (d as Record<string, unknown>).message
      if (detail) return `${status}: ${String(detail)}`
      const first = Object.entries(d as Record<string, unknown>)[0]
      if (first) return `${status}: ${first[0]}: ${Array.isArray(first[1]) ? String(first[1][0]) : String(first[1])}`
      return `${status}: ${JSON.stringify(d)}`
    }
    return `HTTP ${status}`
  }
  return error instanceof Error ? error.message : 'Request failed'
}

// Defined OUTSIDE the parent to prevent remount on every render
function ImageField({ label, value, onChange, id, folder }: {
  label: string; value: string; onChange: (v: string) => void; id: string; folder: string
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input id={id} value={value} onChange={e => onChange(e.target.value)} className="flex-1" placeholder="https://..." />
        <CloudinaryUploader onUpload={url => onChange(url)} folder={folder} buttonText="Upload" />
      </div>
      {value && <img src={value} alt="preview" className="mt-2 h-20 w-full object-cover rounded-lg border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
    </div>
  )
}

// Defined OUTSIDE the parent to prevent remount on every render
function BannerFormFields({ form, setField }: {
  form: BannerFormState
  setField: <K extends keyof BannerFormState>(key: K, value: BannerFormState[K]) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input className="mt-1" value={form.title} onChange={e => setField('title', e.target.value)} />
      </div>
      <ImageField label="Image" value={form.image} onChange={v => setField('image', v)} id="banner-image" folder="banners" />
      <ImageField label="Mobile Image (optional)" value={form.mobileImage} onChange={v => setField('mobileImage', v)} id="banner-mobile-image" folder="banners" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Placement</Label>
          <Select className="mt-1" value={form.placement} onChange={e => setField('placement', e.target.value as Placement)}>
            {placements.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
        <div>
          <Label>Display Type</Label>
          <Select className="mt-1" value={form.displayType} onChange={e => setField('displayType', e.target.value as DisplayType)}>
            {displayTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Link Type</Label>
          <Select className="mt-1" value={form.linkType} onChange={e => setField('linkType', e.target.value as LinkType)}>
            {linkTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div>
          <Label>Link URL</Label>
          <Input className="mt-1" value={form.linkUrl} onChange={e => setField('linkUrl', e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div>
        <Label>CTA Text (optional)</Label>
        <Input className="mt-1" value={form.ctaText} onChange={e => setField('ctaText', e.target.value)} placeholder="e.g. Shop Now" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input type="datetime-local" className="mt-1" value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="datetime-local" className="mt-1" value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Sort Order</Label>
        <Input type="number" className="mt-1" value={form.sortOrder} onChange={e => setField('sortOrder', parseInt(e.target.value) || 0)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={e => setField('isActive', e.target.checked)} />
        Active
      </label>
    </div>
  )
}

export default function BannersPage() {
  const { data, isLoading } = useBanners()
  const { createBanner, updateBanner, deleteBanner, isCreatingBanner, isUpdatingBanner, isDeletingBanner } = useBannerMutations()
  const qc = useQueryClient()
  const { toast } = useToast()

  const verify = useMutation({ mutationFn: (id: string) => verifyBanner(id), onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.banners.all }) })
  const unverify = useMutation({ mutationFn: (id: string) => unverifyBanner(id), onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.banners.all }) })

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState<Banner | null>(null)
  const [form, setForm] = useState<BannerFormState>(defaultForm)

  const setField = <K extends keyof BannerFormState>(key: K, value: BannerFormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const openCreate = () => { setForm(defaultForm); setShowCreate(true) }

  const openEdit = (b: Banner) => {
    setEditing(b)
    const raw = b as unknown as Record<string, unknown>
    setForm({
      title: b.title,
      image: b.image,
      mobileImage: String(raw.mobile_image ?? b.image),
      linkUrl: b.link_url ?? '',
      placement: (raw.placement as Placement) ?? 'CATEGORY_TOP',
      displayType: (raw.display_type as DisplayType) ?? 'BANNER',
      linkType: (raw.link_type as LinkType) ?? 'NONE',
      ctaText: String(raw.cta_text ?? ''),
      startDate: b.start_date ? b.start_date.slice(0, 16) : '',
      endDate: b.end_date ? b.end_date.slice(0, 16) : '',
      sortOrder: Number(raw.sort_order ?? 0),
      isActive: b.is_active,
    })
  }

  const buildPayload = (f: BannerFormState) => ({
    title: f.title.trim(),
    image: f.image.trim(),
    mobile_image: f.mobileImage.trim() || f.image.trim(),
    link_url: f.linkUrl.trim() || '',
    placement: f.placement,
    display_type: f.displayType,
    link_type: f.linkType,
    cta_text: f.ctaText.trim(),
    start_date: f.startDate ? new Date(f.startDate).toISOString() : null,
    end_date: f.endDate ? new Date(f.endDate).toISOString() : null,
    sort_order: f.sortOrder,
    is_active: f.isActive,
  })

  const onCreate = async () => {
    if (!form.title.trim() || !form.image.trim()) return
    try {
      await createBanner(buildPayload(form) as Parameters<typeof createBanner>[0])
      toast({ title: 'Banner created' })
      setShowCreate(false)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Create failed', description: getErrorMessage(e) })
    }
  }

  const onUpdate = async () => {
    if (!editing || !form.title.trim()) return
    try {
      await updateBanner({ id: editing.id, data: buildPayload(form) as Parameters<typeof updateBanner>[0]['data'] })
      toast({ title: 'Banner updated' })
      setEditing(null)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Update failed', description: getErrorMessage(e) })
    }
  }

  const onDelete = async () => {
    if (!deleting) return
    try {
      await deleteBanner(deleting.id)
      toast({ title: 'Banner deleted' })
      setDeleting(null)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete failed', description: getErrorMessage(e) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Banner</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="aspect-[2/1] shimmer" />
              <div className="p-4 space-y-2"><div className="h-4 w-32 rounded shimmer" /><div className="h-3 w-24 rounded shimmer" /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.results ?? []).map(b => {
            const raw = b as unknown as Record<string, unknown>
            return (
              <Card key={b.id} className="overflow-hidden">
                <div className="relative aspect-[2/1] bg-muted">
                  <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <ActiveBadge active={b.is_active} />
                    {b.is_verified && <Badge variant="success">Verified</Badge>}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {String(raw.placement ?? '')} · {String(raw.display_type ?? '')}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(b.start_date)} – {formatDate(b.end_date)}</p>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{(b.impressions ?? b.impression_count ?? 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MousePointer className="h-3 w-3" />{(b.clicks ?? b.click_count ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {b.is_verified
                      ? <Button size="sm" variant="outline" onClick={() => unverify.mutate(b.id)} disabled={unverify.isPending}>Unverify</Button>
                      : <Button size="sm" onClick={() => verify.mutate(b.id)} disabled={verify.isPending}>Verify</Button>}
                    <Button size="sm" variant="outline" onClick={() => openEdit(b)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleting(b)}><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete</Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Banner" size="lg">
        <div className="p-6 space-y-4">
          <BannerFormFields form={form} setField={setField} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => void onCreate()} disabled={isCreatingBanner || !form.title.trim() || !form.image.trim()}>
              {isCreatingBanner ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Edit Banner" size="lg">
        <div className="p-6 space-y-4">
          <BannerFormFields form={form} setField={setField} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void onUpdate()} disabled={isUpdatingBanner || !form.title.trim()}>
              {isUpdatingBanner ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete Banner">
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Permanently delete <span className="font-medium text-foreground">{deleting?.title}</span>?</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void onDelete()} disabled={isDeletingBanner}>{isDeletingBanner ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
