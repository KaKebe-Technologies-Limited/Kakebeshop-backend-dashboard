import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2 } from 'lucide-react'

interface CloudinaryUploadInfo {
  secure_url: string
  public_id: string
  format: string
  width: number
  height: number
  bytes: number
}

interface CloudinaryUploaderProps {
  onUpload: (url: string, info: CloudinaryUploadInfo) => void
  folder?: string
  buttonText?: string
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
}

export function CloudinaryUploader({
  onUpload,
  folder = 'kakebe',
  buttonText = 'Upload Image',
  disabled = false,
  variant = 'outline',
}: CloudinaryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

    if (!cloudName || !uploadPreset) {
      alert('Cloudinary credentials missing.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)
      formData.append('folder', folder)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )

      if (!res.ok) {
        const err = await res.json() as { error?: { message?: string } }
        throw new Error(err?.error?.message ?? 'Upload failed')
      }

      const data = await res.json() as CloudinaryUploadInfo & { secure_url: string }
      onUpload(data.secure_url, data)
    } catch (err) {
      console.error('Upload error:', err)
      alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={e => void handleFileChange(e)}
      />
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
      >
        {loading
          ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          : <Upload className="h-4 w-4 mr-2" />}
        {loading ? 'Uploading...' : buttonText}
      </Button>
    </>
  )
}
