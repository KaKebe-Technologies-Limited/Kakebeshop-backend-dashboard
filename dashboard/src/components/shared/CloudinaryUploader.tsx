import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

interface CloudinaryUploadInfo {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

interface CloudinaryUploaderProps {
  onUpload: (url: string, info: CloudinaryUploadInfo) => void;
  folder?: string;
  buttonText?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
}

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (
          error: unknown,
          result: { event: string; info: CloudinaryUploadInfo },
        ) => void,
      ) => { open: () => void };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadCloudinaryScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (window.cloudinary) {
    scriptPromise = Promise.resolve();
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("cloudinary-widget-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "cloudinary-widget-script";
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export function CloudinaryUploader({
  onUpload,
  folder = "kakebe",
  buttonText = "Upload Image",
  disabled = false,
  variant = "outline",
}: CloudinaryUploaderProps) {
  const widgetRef = useRef<{ open: () => void } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadCloudinaryScript();
  }, []);

  const openWidget = async () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
    const uploadPreset = import.meta.env
      .VITE_CLOUDINARY_UPLOAD_PRESET as string;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary credentials missing.");
      return;
    }

    setLoading(true);
    try {
      await loadCloudinaryScript();
    } catch {
      alert("Failed to load Cloudinary. Check your internet connection.");
      setLoading(false);
      return;
    }
    setLoading(false);

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        folder,
        sources: ["local", "url", "camera"],
        multiple: false,
        maxFiles: 1,
        clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
        maxFileSize: 10_000_000,
        showSkipCropButton: true,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return;
        }
        if (result.event === "success")
          onUpload(result.info.secure_url, result.info);
      },
    );

    widgetRef.current.open();
  };

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={() => void openWidget()}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Upload className="h-4 w-4 mr-2" />
      )}
      {loading ? "Loading..." : buttonText}
    </Button>
  );
}
