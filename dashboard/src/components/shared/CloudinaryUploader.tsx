import { useEffect, useRef, useState } from 'react'
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

// Wait for window.cloudinary to be available after script loads
function waitForCloudinary(timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.cloudinary) { resolve(); return }
    const start = Date.now()
    const interval = setInterval(() => {
      if (window.cloudinary) {
        clearInterval(interval)
        resolve()
      } else if (Date.now() - start > timeout) {
        clearInterval(interval)
        reject(new Error('Cloudinary widget timed out'))
      }
    }, 100)
  })
}

let scriptLoaded = false

function loadCloudinaryScript(): Promise<void> {
  if (scriptLoaded && window.cloudinary) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('cloudinary-widget-script')
    if (existing) {
      void waitForCloudinary().then(resolve).catch(reject)
      return
    }
    const script = document.createElement('script')
    script.id = 'cloudinary-widget-script'
    script.src = 'https://upload-widget.cloudinary.com/global/all.js'
    script.async = true
    script.onload = () => {
      scriptLoaded = true
      void waitForCloudinary().then(resolve).catch(reject)
    }
    script.onerror = () => reject(new Error('Failed to load Cloudinary script'))
    document.body.appendChild(script)
  })
}

export function CloudinaryUploader({
  onUpload,
  folder = 'kakebe',
  buttonText = 'Upload Image',
  disabled = false,
  variant = 'outline',
}: CloudinaryUploaderProps) {
  const widgetRef = useRef<{ open: () => void } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void loadCloudinaryScript()
  }, [])

  const openWidget = async () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

    if (!cloudName || !uploadPreset) {
      alert('Cloudinary credentials missing. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
      return
    }

    setLoading(true)
    try {
      await loadCloudinaryScript()
    } catch (e) {
      console.error(e)
      alert('Failed to load Cloudinary. Check your internet connection and try again.')
      setLoading(false)
      return
    }
    setLoading(false)

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
        if (result.event === 'success') onUpload(result.info.secure_url, result.info)
      }
    )

    widgetRef.current.open()
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={() => void openWidget()}
      disabled={disabled || loading}
    >
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
      {loading ? 'Loading...' : buttonText}
    </Button>
  )
}
