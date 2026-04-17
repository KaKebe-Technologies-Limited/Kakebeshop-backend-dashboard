import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

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

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: { event: string; info: CloudinaryUploadInfo }) => void
      ) => { open: () => void }
    }
  }
}

export function CloudinaryUploader({
  onUpload,
  folder = 'kakebe',
  buttonText = 'Upload Image',
  disabled = false,
  variant = 'outline',
}: CloudinaryUploaderProps) {
  const widgetRef = useRef<{ open: () => void } | null>(null)

  useEffect(() => {
    if (document.getElementById('cloudinary-widget-script')) return
    const script = document.createElement('script')
    script.id = 'cloudinary-widget-script'
    script.src = 'https://upload-widget.cloudinary.com/global/all.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const openWidget = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

    if (!cloudName || !uploadPreset) {
      alert('Cloudinary credentials missing. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env.local')
      return
    }

    if (!window.cloudinary) {
      alert('Cloudinary widget is still loading, please try again.')
      return
    }

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        folder,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        maxFileSize: 10_000_000,
        showSkipCropButton: true,
      },
      (error, result) => {
        if (error) { console.error('Cloudinary error:', error); return }
        if (result.event === 'success') {
          onUpload(result.info.secure_url, result.info)
        }
      }
    )

    widgetRef.current.open()
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={openWidget} disabled={disabled}>
      <Upload className="h-4 w-4 mr-2" />
      {buttonText}
    </Button>
  )
}
