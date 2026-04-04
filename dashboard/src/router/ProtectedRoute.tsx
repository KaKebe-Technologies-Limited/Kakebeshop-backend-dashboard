import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { pathname } = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />
  }
  return <>{children}</>
}
