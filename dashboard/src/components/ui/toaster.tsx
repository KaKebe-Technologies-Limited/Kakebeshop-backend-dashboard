import {
  Toast as ToastComponent,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastActionElement,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

interface Toast {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

export function Toaster() {
  const { toasts } = useToast() as { toasts: Toast[] }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <ToastComponent key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </ToastComponent>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}