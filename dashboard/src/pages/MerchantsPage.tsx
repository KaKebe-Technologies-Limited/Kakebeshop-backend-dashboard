import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, ShieldCheck, Star, Trash2, Ban, PauseCircle, Phone, Mail, Download } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { MerchantAvatar } from '@/components/shared/MerchantAvatar'
import { MerchantAccountStatusBadge } from '@/components/shared/StatusBadge'
import { CloudinaryUploader } from '@/components/shared/CloudinaryUploader'
import { StarRating } from '@/components/shared/StarRating'
import { Card } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { ntfyService } from '@/services/ntfyService'
import type { MerchantListItem } from '@/types'

// Send ntfy alert to Kakebe-Shop-merchants when an action is taken
async function notifyMerchantAction(action: string, merchantName: string, phone: string | null, email: string | null) {
  const contact = [phone && `Phone: ${phone}`, email && `Email: ${email}`].filter(Boolean).join('\n')
  await ntfyService.sendNotification(
    { title: `Merchant ${action} - Kakebe Shop`, tags: ['store', 'bell'], priority: 'default' },
    `Merchant: ${merchantName}\n${contact}`
  )
}

// Download an image by drawing it to canvas to bypass CDN CORS restrictions
async function downloadImage(url: string, filename: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not supported')); return }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Failed to create blob')); return }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        a.click()
        URL.revokeObjectURL(a.href)
        resolve()
      }, 'image/png')
    }
    img.onerror = () => {
      // Canvas CORS failed — fall back to opening in new tab
      window.open(url, '_blank')
      resolve()
    }
    img.src = url
  })
}

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
  const [showImageEdit, setShowImageEdit] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [downloading, setDownloading] = useState(false)

  const { toast } = useToast()

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
    ordering: '-created_at',
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
    const { type, id, name } = confirmAction
    const phone = detail?.business_phone ?? null
    const email = detail?.business_email ?? detail?.user_email ?? null

    const done = () => {
      setConfirmAction(null)
      setSelectedId(null)
      // Send ntfy notification after action
      const actionLabel = {
        verify: 'Verified',
        feature: 'Featured',
        unfeature: 'Unfeatured',
        suspend: 'Suspended',
        ban: 'Banned',
        delete: 'Deleted',
      }[type]
      void notifyMerchantAction(actionLabel, name, phone, email)
      toast({ title: `Merchant ${actionLabel}` })
    }

    if (type === 'verify') verifyMutation.mutate(id, { onSuccess: done })
    else if (type === 'feature') updateMutation.mutate({ id, payload: { featured: true } }, { onSuccess: done })
    else if (type === 'unfeature') updateMutation.mutate({ id, payload: { featured: false } }, { onSuccess: done })
    else if (type === 'suspend') suspendMutation.mutate(id, { onSuccess: done })
    else if (type === 'ban') banMutation.mutate(id, { onSuccess: done })
    else if (type === 'delete') deleteMutation.mutate(id, { onSuccess: done })
  }

  const openImageEdit = () => {
    if (!detail) return
    setLogoUrl(detail.logo ?? '')
    setCoverUrl(detail.cover_image ?? '')
    setShowImageEdit(true)
  }

  const saveImages = async () => {
    if (!detail) return
    const payload: Record<string, string> = {}
    if (logoUrl !== (detail.logo ?? '')) payload.logo = logoUrl
    if (coverUrl !== (detail.cover_image ?? '')) payload.cover_image = coverUrl
    if (Object.keys(payload).length === 0) { setShowImageEdit(false); return }
    updateMutation.mutate(
      { id: detail.id, payload },
      {
        onSuccess: () => { toast({ title: 'Images updated' }); setShowImageEdit(false) },
        onError: () => toast({ variant: 'destructive', title: 'Update failed' }),
      }
    )
  }

  const actionLabels = {
    verify: 'Verify this merchant? A notification will be sent.',
    feature: 'Feature this merchant?',
    unfeature: 'Remove from featured?',
    suspend: 'Suspend this merchant? A notification will be sent.',
    ban: 'Ban this merchant? A notification will be sent.',
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
                    <TableCell><MerchantAvatar logo={m.logo} name={m.display_name} size="sm" /></TableCell>
                    <TableCell className="font-medium">{m.display_name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{m.business_name ?? '—'}</TableCell>
                    <TableCell><StarRating rating={m.rating} total={m.total_reviews} /></TableCell>
                    <TableCell>
                      {m.verified ? <Badge variant="success">Verified</Badge> : <Badge variant="muted">Unverified</Badge>}
                      {m.featured && <Badge variant="warning" className="ml-1">Featured</Badge>}
                    </TableCell>
                    <TableCell><MerchantAccountStatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(m.created_at)}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="View" onClick={() => setSelectedId(m.id)}><Eye className="h-4 w-4" /></Button>
                        {!m.verified && (
                          <Button variant="ghost" size="icon" title="Verify" onClick={() => setConfirmAction({ type: 'verify', id: m.id, name: m.display_name })}>
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title={m.featured ? 'Unfeature' : 'Feature'} onClick={() => setConfirmAction({ type: m.featured ? 'unfeature' : 'feature', id: m.id, name: m.display_name })}>
                          <Star className={`h-4 w-4 ${m.featured ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                        {m.status === 'ACTIVE' && (
                          <Button variant="ghost" size="icon" title="Suspend" onClick={() => setConfirmAction({ type: 'suspend', id: m.id, name: m.display_name })}>
                            <PauseCircle className="h-4 w-4 text-orange-500" />
                          </Button>
                        )}
                        {m.status !== 'BANNED' && (
                          <Button variant="ghost" size="icon" title="Ban" onClick={() => setConfirmAction({ type: 'ban', id: m.id, name: m.display_name })}>
                            <Ban className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => setConfirmAction({ type: 'delete', id: m.id, name: m.display_name })}>
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
        {data && <Pagination page={page} totalPages={totalPages} count={data.count} onPage={p => set('page', String(p))} />}
      </Card>

      {/* Confirm Action Dialog */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)} title="Confirm Action" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm">
            <span className="font-semibold">{confirmAction?.name}</span>{' — '}
            {confirmAction ? actionLabels[confirmAction.type] : ''}
          </p>
          <div className="flex gap-3">
            <Button className="flex-1" variant={confirmAction?.type === 'delete' || confirmAction?.type === 'ban' ? 'destructive' : 'default'} onClick={handleConfirm} disabled={isPending}>
              {isPending ? 'Processing…' : 'Confirm'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)} disabled={isPending}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Image Edit Dialog */}
      <Dialog open={showImageEdit} onClose={() => setShowImageEdit(false)} title="Update Merchant Images" size="lg">
        <div className="p-6 space-y-5">
          <div>
            <Label>Logo</Label>
            <div className="flex gap-2 mt-1">
              <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="flex-1" />
              <CloudinaryUploader onUpload={url => setLogoUrl(url)} folder="merchants/logos" buttonText="Upload" />
            </div>
            {logoUrl && <img src={logoUrl} alt="logo preview" className="mt-2 h-16 w-16 rounded-full object-cover border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
          </div>
          <div>
            <Label>Cover Image</Label>
            <div className="flex gap-2 mt-1">
              <Input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." className="flex-1" />
              <CloudinaryUploader onUpload={url => setCoverUrl(url)} folder="merchants/covers" buttonText="Upload" />
            </div>
            {coverUrl && <img src={coverUrl} alt="cover preview" className="mt-2 h-24 w-full rounded-lg object-cover border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowImageEdit(false)}>Cancel</Button>
            <Button onClick={() => void saveImages()} disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save Images'}</Button>
          </div>
        </div>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedId && !confirmAction && !showImageEdit} onClose={() => setSelectedId(null)} title="Merchant Details" size="lg">
        {detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            {detail.cover_image && (
              <div className="relative h-32 rounded-lg overflow-hidden bg-muted">
                <img src={detail.cover_image} alt="cover" className="h-full w-full object-cover" />
              </div>
            )}

            <div className="flex gap-4 items-start">
              <div className="relative group flex-shrink-0">
                <MerchantAvatar logo={detail.logo} name={detail.display_name} size="lg" />
                {detail.logo && (
                  <button
                    onClick={async () => {
                      setDownloading(true)
                      try {
                        await downloadImage(detail.logo!, `${detail.display_name.replace(/\s+/g, '_')}_logo.png`)
                        toast({ title: 'Logo downloaded' })
                      } catch {
                        toast({ variant: 'destructive', title: 'Download failed' })
                      } finally {
                        setDownloading(false)
                      }
                    }}
                    disabled={downloading}
                    title="Download logo"
                    className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1 shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                )}
              </div>
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

            {/* Contact info — clickable */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
              {detail.business_phone && (
                <a href={`tel:${detail.business_phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone className="h-4 w-4" /> {detail.business_phone}
                </a>
              )}
              {detail.business_email && (
                <a href={`mailto:${detail.business_email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Mail className="h-4 w-4" /> {detail.business_email}
                </a>
              )}
              {detail.user_email && (
                <a href={`mailto:${detail.user_email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:underline">
                  <Mail className="h-4 w-4" /> {detail.user_email} <span className="text-xs">(account)</span>
                </a>
              )}
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
              <Button size="sm" variant="outline" onClick={openImageEdit}>Update Images</Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmAction({ type: 'delete', id: detail.id, name: detail.display_name })}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'User', value: detail.user_name },
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
