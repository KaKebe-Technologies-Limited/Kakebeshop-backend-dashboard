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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
      const base64 = await fileToBase64(file)

      // Use FormData with base64 string — avoids binary CORS preflight issues
      const formData = new FormData()
      formData.append('file', base64)
      formData.append('upload_preset', uploadPreset)
      formData.append('folder', folder)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )

      const data = await res.json() as CloudinaryUploadInfo & { error?: { message: string } }

      if (!res.ok || data.error) {
        throw new Error(data.error?.message ?? `HTTP ${res.status}`)
      }

      onUpload(data.secure_url, data)
    } catch (err) {
      console.error('Upload error:', err)
      // Log full details to help diagnose
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        console.error('CORS or network error — check browser DevTools Network tab for details')
      }
      alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
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
