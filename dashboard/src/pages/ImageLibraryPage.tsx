import { useState, useEffect } from 'react'
import { CloudinaryUploader } from '@/components/shared/CloudinaryUploader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Copy, Trash2, Images, Check, LayoutGrid, List, Columns, ExternalLink } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatDateTime } from '@/lib/utils'

interface StoredImage {
  id: string
  url: string
  public_id: string
  format: string
  width: number
  height: number
  bytes: number
  uploaded_at: string
  folder: string
}

type ViewMode = 'grid' | 'list' | 'masonry'

const STORAGE_KEY = 'kakebe_image_library'

function loadImages(): StoredImage[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function saveImages(images: StoredImage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images))
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageLibraryPage() {
  const [images, setImages] = useState<StoredImage[]>(loadImages)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [filterFormat, setFilterFormat] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selected, setSelected] = useState<StoredImage | null>(null)
  const { toast } = useToast()

  useEffect(() => { saveImages(images) }, [images])

  const handleUpload = (url: string, info: { public_id: string; format: string; width: number; height: number; bytes: number }) => {
    const folder = info.public_id.includes('/') ? info.public_id.split('/')[0] : 'kakebe'
    setImages(prev => [{
      id: crypto.randomUUID(), url,
      public_id: info.public_id, format: info.format,
      width: info.width, height: info.height, bytes: info.bytes,
      uploaded_at: new Date().toISOString(), folder,
    }, ...prev])
    toast({ title: 'Image uploaded' })
  }

  const copyUrl = (img: StoredImage) => {
    void navigator.clipboard.writeText(img.url)
    setCopiedId(img.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({ title: 'URL copied' })
  }

  const deleteImage = (id: string) => {
    setImages(prev => prev.filter(i => i.id !== id))
    setDeleting(null)
    setSelected(null)
    toast({ title: 'Removed from library' })
  }

  const formats = [...new Set(images.map(i => i.format))]

  const filtered = images.filter(img => {
    const matchSearch = img.public_id.toLowerCase().includes(search.toLowerCase()) || img.format.toLowerCase().includes(search.toLowerCase())
    const matchFormat = !filterFormat || img.format === filterFormat
    return matchSearch && matchFormat
  })

  const totalSize = images.reduce((acc, i) => acc + i.bytes, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Images className="h-6 w-6" /> Image Library</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {images.length} image{images.length !== 1 ? 's' : ''} · {formatBytes(totalSize)} total
          </p>
        </div>
        <CloudinaryUploader onUpload={handleUpload} folder="kakebe" buttonText="Upload Image" variant="default" />
      </div>

      {/* Toolbar */}
      {images.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by filename or format..." className="w-56" />
          {formats.length > 1 && (
            <select
              value={filterFormat}
              onChange={e => setFilterFormat(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All formats</option>
              {formats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          )}
          <div className="flex items-center gap-1 ml-auto border border-border rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded ${view === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('masonry')}
              className={`p-1.5 rounded ${view === 'masonry' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="Masonry view"
            >
              <Columns className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded ${view === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Images className="h-12 w-12 opacity-30" />
          <div className="text-center">
            <p className="font-medium">No images yet</p>
            <p className="text-sm mt-1">Upload your first image to get started</p>
          </div>
          <CloudinaryUploader onUpload={handleUpload} folder="kakebe" buttonText="Upload First Image" variant="default" />
        </Card>
      )}

      {filtered.length === 0 && images.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No images match your search.</p>
      )}

      {/* Grid View */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(img => (
            <Card key={img.id} className="overflow-hidden group cursor-pointer" onClick={() => setSelected(img)}>
              <div className="relative aspect-square bg-muted">
                <img src={img.url} alt={img.public_id} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" onClick={e => { e.stopPropagation(); copyUrl(img) }}>
                    {copiedId === img.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="destructive" onClick={e => { e.stopPropagation(); setDeleting(img.id) }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-2 space-y-1">
                <p className="text-xs font-medium truncate">{img.public_id.split('/').pop()}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">{img.format.toUpperCase()}</Badge>
                  <span className="text-[10px] text-muted-foreground">{img.width}×{img.height}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Masonry View */}
      {view === 'masonry' && filtered.length > 0 && (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {filtered.map(img => (
            <div key={img.id} className="break-inside-avoid group relative cursor-pointer rounded-lg overflow-hidden border border-border" onClick={() => setSelected(img)}>
              <img src={img.url} alt={img.public_id} className="w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" onClick={e => { e.stopPropagation(); copyUrl(img) }}>
                  {copiedId === img.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="destructive" onClick={e => { e.stopPropagation(); setDeleting(img.id) }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs truncate">{img.public_id.split('/').pop()}</p>
                <p className="text-[10px] text-white/70">{img.width}×{img.height} · {formatBytes(img.bytes)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && filtered.length > 0 && (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map(img => (
              <div key={img.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer" onClick={() => setSelected(img)}>
                <img src={img.url} alt="" className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{img.public_id.split('/').pop()}</p>
                  <p className="text-xs text-muted-foreground truncate">{img.public_id}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px]">{img.format.toUpperCase()}</Badge>
                    <span className="text-[10px] text-muted-foreground">{img.width}×{img.height}</span>
                    <span className="text-[10px] text-muted-foreground">{formatBytes(img.bytes)}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(img.uploaded_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => copyUrl(img)}>
                    {copiedId === img.id ? <><Check className="h-3 w-3 mr-1 text-green-500" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy URL</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => window.open(img.url, '_blank')}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(img.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Image Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="font-medium truncate">{selected.public_id.split('/').pop()}</p>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-auto">
              <img src={selected.url} alt="" className="w-full object-contain max-h-[60vh]" />
            </div>
            <div className="p-4 border-t border-border space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Dimensions</p><p className="font-medium">{selected.width}×{selected.height}</p></div>
                <div><p className="text-xs text-muted-foreground">Size</p><p className="font-medium">{formatBytes(selected.bytes)}</p></div>
                <div><p className="text-xs text-muted-foreground">Format</p><p className="font-medium">{selected.format.toUpperCase()}</p></div>
                <div><p className="text-xs text-muted-foreground">Uploaded</p><p className="font-medium">{formatDateTime(selected.uploaded_at)}</p></div>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground flex-1 truncate">{selected.url}</p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => copyUrl(selected)}>
                  {copiedId === selected.id ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy URL</>}
                </Button>
                <Button variant="outline" onClick={() => window.open(selected.url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Open
                </Button>
                <Button variant="destructive" onClick={() => setDeleting(selected.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-sm w-full space-y-4">
            <p className="font-semibold">Remove from library?</p>
            <p className="text-sm text-muted-foreground">This removes the image from your library. The file still exists on Cloudinary.</p>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={() => deleteImage(deleting)}>Remove</Button>
              <Button variant="outline" className="flex-1" onClick={() => setDeleting(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
