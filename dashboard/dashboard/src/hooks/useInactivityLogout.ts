import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/api/auth'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export function useInactivityLogout() {
  const { isAuthenticated, refresh, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    function reset() {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        if (refresh) {
          try { await logout(refresh) } catch { /* ignore */ }
        }
        storeLogout()
        navigate('/login?reason=timeout', { replace: true })
      }, TIMEOUT_MS)
    }

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      if (timer.current) clearTimeout(timer.current)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [isAuthenticated, refresh, storeLogout, navigate])
}
