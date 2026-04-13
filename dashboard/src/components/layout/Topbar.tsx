import { Bell, LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/api/auth'
import { useUnreadCount } from '@/hooks/useReports'
import { RealtimeIndicator } from '@/components/RealtimeProvider'
import { Button } from '@/components/ui/button'

interface TopbarProps { title: string }

export function Topbar({ title }: TopbarProps) {
  const navigate = useNavigate()
  const { name, username, refresh, logout: storeLogout, isAuthenticated } = useAuthStore()
  const { data: unreadCount = 0 } = useUnreadCount()

  async function handleLogout() {
    if (refresh) {
      try { await logout(refresh) } catch { /* ignore */ }
    }
    storeLogout()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        {isAuthenticated && (
          <>
            <RealtimeIndicator />
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-foreground leading-none">{name ?? username ?? 'Admin'}</p>
          </div>
        </div>

        {isAuthenticated && (
          <Button variant="ghost" size="icon" onClick={() => void handleLogout()} title="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
