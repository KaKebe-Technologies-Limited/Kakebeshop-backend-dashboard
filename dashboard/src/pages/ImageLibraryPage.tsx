import { useState, useEffect } from 'react'
import { CloudinaryUploader } from '@/components/shared/CloudinaryUploader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Copy, Trash2, Images, Check } from 'lucide-react'
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

const STORAGE_KEY = 'kakebe_image_library'

function loadImages(): StoredImage[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveImages(images: StoredImage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images))
}

export default function ImageLibraryPage() {
  const [images, setImages] = useState<StoredImage[]>(loadImages)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    saveImages(images)
  }, [images])

  const handleUpload = (url: string, info: { public_id: string; format: string; width: number; height: number; bytes: number }) => {
    const folder = info.public_id.includes('/') ? info.public_id.split('/')[0] : 'kakebe'
    const newImage: StoredImage = {
      id: crypto.randomUUID(),
      url,
      public_id: info.public_id,
      format: info.format,
      width: info.width,
      height: info.height,
      bytes: info.bytes,
      uploaded_at: new Date().toISOString(),
      folder,
    }
    setImages(prev => [newImage, ...prev])
    toast({ title: 'Image uploaded', description: 'Image added to your library.' })
  }

  const copyUrl = (image: StoredImage) => {
    void navigator.clipboard.writeText(image.url)
    setCopiedId(image.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({ title: 'URL copied', description: 'Image URL copied to clipboard.' })
  }

  const deleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
    setDeleting(null)
    toast({ title: 'Image removed', description: 'Removed from library. The file still exists on Cloudinary.' })
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filtered = images.filter(img =>
    img.public_id.toLowerCase().includes(search.toLowerCase()) ||
    img.format.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Images className="h-6 w-6" /> Image Library
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {images.length} image{images.length !== 1 ? 's' : ''} · Upload and copy URLs for use across the dashboard
          </p>
        </div>
        <CloudinaryUploader
          onUpload={handleUpload}
          folder="kakebe"
          buttonText="Upload Image"
          variant="default"
        />
      </div>

      {/* Search */}
      {images.length > 0 && (
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by filename or format..."
          className="max-w-sm"
        />
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

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map(img => (
            <Card key={img.id} className="overflow-hidden group">
              <div className="relative aspect-square bg-muted">
                <img
                  src={img.url}
                  alt={img.public_id}
                  className="h-full w-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = '' }}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => copyUrl(img)}
                    title="Copy URL"
                  >
                    {copiedId === img.id
                      ? <Check className="h-4 w-4 text-green-500" />
                      : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => setDeleting(img.id)}
                    title="Remove from library"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                <p className="text-xs font-medium truncate" title={img.public_id}>
                  {img.public_id.split('/').pop()}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">{img.format.toUpperCase()}</Badge>
                  <span className="text-[10px] text-muted-foreground">{img.width}×{img.height}</span>
                  <span className="text-[10px] text-muted-foreground">{formatBytes(img.bytes)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{formatDateTime(img.uploaded_at)}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => copyUrl(img)}
                >
                  {copiedId === img.id ? <><Check className="h-3 w-3 mr-1" /> Copied!</> : <><Copy className="h-3 w-3 mr-1" /> Copy URL</>}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && images.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No images match your search.</p>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-sm w-full space-y-4">
            <p className="font-semibold">Remove from library?</p>
            <p className="text-sm text-muted-foreground">
              This removes the image from your library view. The file will still exist on Cloudinary.
            </p>
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
