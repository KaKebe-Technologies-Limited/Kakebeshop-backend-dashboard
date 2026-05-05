import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/api/auth'
import { useUnreadCount } from '@/hooks/useReports'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { MdNotifications, MdLogout, MdWifi, MdWifiOff, MdChevronRight } from 'react-icons/md'
import { dashboardRoutes } from '@/router'

interface TopbarProps { title: string }

function OnlineIndicator() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
      online
        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        : 'bg-red-500/10 text-red-500 border-red-500/20'
    }`}>
      {online ? <MdWifi className="h-3.5 w-3.5" /> : <MdWifiOff className="h-3.5 w-3.5" />}
      {online ? 'Online' : 'Offline'}
    </div>
  )
}

function Breadcrumb() {
  const { pathname } = useLocation()
  if (pathname === '/') return <span className="text-sm font-semibold text-foreground">Overview</span>

  const route = dashboardRoutes.find(r => r.path && pathname === `/${r.path}`)
  const label = route?.label ?? pathname.replace('/', '').replace(/-/g, ' ')

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-muted-foreground/60">Kakebe Admin</span>
      <MdChevronRight className="h-4 w-4 text-muted-foreground/40" />
      <span className="font-semibold text-foreground capitalize">{label}</span>
    </div>
  )
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500/10 text-red-500 border-red-500/20',
  admin: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  moderator: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  support: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  viewer: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  support: 'Support',
  viewer: 'Viewer',
}

export function Topbar({ title: _title }: TopbarProps) {
  const navigate = useNavigate()
  const { name, username, role, refresh, logout: storeLogout, isAuthenticated } = useAuthStore()
  const { data: unreadCount = 0 } = useUnreadCount()

  async function handleLogout() {
    if (refresh) {
      try { await logout(refresh) } catch { /* ignore */ }
    }
    storeLogout()
    navigate('/login')
  }

  const initials = (name ?? username ?? 'A')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3 h-14">
      <Breadcrumb />

      <div className="flex items-center gap-2">
        {isAuthenticated && (
          <>
            <OnlineIndicator />

            <button
              onClick={() => navigate('/notifications')}
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Notifications"
            >
              <MdNotifications className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-2.5 py-1.5 hover:bg-muted/40 transition-colors">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-2 ring-primary/20">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-foreground leading-none">{name ?? username ?? 'Admin'}</p>
            <span className={`inline-flex items-center mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[role] ?? ROLE_COLORS.admin}`}>
              {ROLE_LABELS[role] ?? 'Admin'}
            </span>
          </div>
        </div>

        {isAuthenticated && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void handleLogout()}
            title="Log out"
            className="text-muted-foreground hover:text-destructive"
          >
            <MdLogout className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
