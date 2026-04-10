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
import { formatDate } from '@/lib/utils'
import { queryKeys } from '@/lib/queryKeys'
import { useToast } from '@/components/ui/use-toast'
import { Eye, MousePointer, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Banner, BannerPlacement } from '@/types'

const placements: BannerPlacement[] = ['HOME_TOP', 'HOME_MIDDLE', 'CATEGORY', 'SEARCH']

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const responseData = (error as { response?: { data?: unknown } }).response?.data
    if (typeof responseData === 'string') return responseData
    if (typeof responseData === 'object' && responseData !== null) {
      const first = Object.values(responseData as Record<string, unknown>)[0]
      if (Array.isArray(first) && first.length > 0) return String(first[0])
    }
  }
  return 'Request failed. Check backend validation and permissions.'
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
  const [title, setTitle] = useState('')
  const [image, setImage] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [placement, setPlacement] = useState<BannerPlacement>('HOME_TOP')
  const [isActive, setIsActive] = useState(true)

  const resetForm = () => {
    setTitle('')
    setImage('')
    setLinkUrl('')
    setPlacement('HOME_TOP')
    setIsActive(true)
  }

  const openCreate = () => {
    resetForm()
    setShowCreate(true)
  }

  const openEdit = (banner: Banner) => {
    setEditing(banner)
    setTitle(banner.title)
    setImage(banner.image)
    setLinkUrl(banner.link_url ?? '')
    setPlacement(banner.placement)
    setIsActive(banner.is_active)
  }

  const onCreate = async () => {
    if (!title.trim() || !image.trim()) return
    try {
      await createBanner({
        title: title.trim(),
        image: image.trim(),
        link_url: linkUrl.trim() || null,
        placement,
        is_active: isActive,
      })
      toast({ title: 'Banner created', description: 'Banner was created successfully.' })
      setShowCreate(false)
      resetForm()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Create failed', description: getErrorMessage(e) })
    }
  }

  const onUpdate = async () => {
    if (!editing || !title.trim()) return
    try {
      await updateBanner({
        id: editing.id,
        data: {
          title: title.trim(),
          image: image.trim() || undefined,
          link_url: linkUrl.trim() || null,
          placement,
          is_active: isActive,
        },
      })
      toast({ title: 'Banner updated', description: 'Changes were saved successfully.' })
      setEditing(null)
      resetForm()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Update failed', description: getErrorMessage(e) })
    }
  }

  const onDelete = async () => {
    if (!deleting) return
    try {
      await deleteBanner(deleting.id)
      toast({ title: 'Banner deleted', description: 'Banner was removed successfully.' })
      setDeleting(null)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete failed', description: getErrorMessage(e) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="aspect-[2/1] shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-32 rounded shimmer" />
                <div className="h-3 w-24 rounded shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.results.map(b => (
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
                    {b.placement} · {formatDate(b.start_date)} – {formatDate(b.end_date)}
                  </p>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{(b.impression_count ?? 0).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><MousePointer className="h-3 w-3" />{(b.click_count ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.is_verified ? (
                    <Button size="sm" variant="outline" onClick={() => unverify.mutate(b.id)} loading={unverify.isPending}>
                      Unverify
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => verify.mutate(b.id)} loading={verify.isPending}>
                      Verify
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(b)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Banner" size="lg">
        <div className="space-y-4 p-6">
          <div>
            <Label htmlFor="create-title">Title</Label>
            <Input id="create-title" className="mt-1" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="create-image">Image URL</Label>
            <Input id="create-image" className="mt-1" value={image} onChange={e => setImage(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="create-link">Link URL</Label>
            <Input id="create-link" className="mt-1" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="create-placement">Placement</Label>
            <Select id="create-placement" className="mt-1" value={placement} onChange={e => setPlacement(e.target.value as BannerPlacement)}>
              {placements.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Active banner
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => void onCreate()} disabled={isCreatingBanner || !title.trim() || !image.trim()}>
              {isCreatingBanner ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Edit Banner" size="lg">
        <div className="space-y-4 p-6">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" className="mt-1" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-image">Image URL</Label>
            <Input id="edit-image" className="mt-1" value={image} onChange={e => setImage(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-link">Link URL</Label>
            <Input id="edit-link" className="mt-1" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-placement">Placement</Label>
            <Select id="edit-placement" className="mt-1" value={placement} onChange={e => setPlacement(e.target.value as BannerPlacement)}>
              {placements.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Active banner
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void onUpdate()} disabled={isUpdatingBanner || !title.trim()}>
              {isUpdatingBanner ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete Banner">
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            This will permanently delete banner <span className="font-medium text-foreground">{deleting?.title}</span>.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void onDelete()} disabled={isDeletingBanner}>
              {isDeletingBanner ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
