import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { dashboardRoutes } from '@/router'
import { useOrders } from '@/hooks/useOrders'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// React Icons — much richer set than lucide
import { MdDashboard, MdListAlt, MdCategory, MdLocalOffer,
  MdBarChart, MdFlag, MdCreditCard, MdImage, MdMessage, MdHistory,
  MdPeople, MdManageAccounts, MdPayments, MdConfirmationNumber,
  MdStar, MdSettings, MdShield, MdNotifications,
  MdImageSearch, MdBrush, MdAnalytics, MdSupportAgent } from 'react-icons/md'
import { RiLiveLine, RiShoppingBag3Line, RiStore2Line } from 'react-icons/ri'
import { FiHeart } from 'react-icons/fi'
import { HiOutlineUsers } from 'react-icons/hi'

const iconMap: Record<string, React.ElementType> = {
  '': MdDashboard,
  'live-orders': RiLiveLine,
  'orders': RiShoppingBag3Line,
  'merchants': RiStore2Line,
  'listings': MdListAlt,
  'categories': MdCategory,
  'tags': MdLocalOffer,
  'image-library': MdImageSearch,
  'image-editor': MdBrush,
  'analytics': MdAnalytics,
  'reports': MdFlag,
  'transactions': MdCreditCard,
  'banners': MdImage,
  'audit-logs': MdHistory,
  'conversations': MdMessage,
  'user-registrations': HiOutlineUsers,
  'visitor-analytics': MdBarChart,
  'settings': MdSettings,
  'help': MdSupportAgent,
  'customers': MdPeople,
  'staff': MdManageAccounts,
  'payouts': MdPayments,
  'coupons': MdConfirmationNumber,
  'reviews': MdStar,
  'role-management': MdShield,
  'cart-wishlist': FiHeart,
  'notifications': MdNotifications,
}

const navSections = [
  { label: 'General', paths: [''] },
  { label: 'Catalog', paths: ['merchants', 'listings', 'categories', 'tags'] },
  { label: 'Media', paths: ['image-library', 'image-editor', 'banners'] },
  { label: 'Users', paths: ['customers', 'staff', 'user-registrations', 'role-management'] },
  { label: 'Commerce', paths: ['live-orders', 'orders', 'transactions', 'payouts', 'coupons', 'cart-wishlist'] },
  { label: 'Trust & Safety', paths: ['reviews', 'reports'] },
  { label: 'Content', paths: ['conversations', 'notifications'] },
  { label: 'Insights', paths: ['analytics', 'visitor-analytics', 'audit-logs'] },
  { label: 'Other', paths: ['settings', 'help'] },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const availablePaths = new Set(dashboardRoutes.map(r => r.path))
  const { data: ordersData } = useOrders({ status: 'NEW', ordering: '-created_at' })
  const newOrderCount = ordersData?.count ?? 0

  return (
    <aside className={cn(
      'flex flex-col bg-card border-r border-border transition-all duration-300 flex-shrink-0',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-4 border-b border-border',
        collapsed && 'justify-center px-2'
      )}>
        <img src="/kakebe-shop.png" alt="Kakebe Shop" className="flex-shrink-0 h-9 w-9 rounded-xl object-cover shadow-sm" />
        {!collapsed && (
          <div>
            <p className="font-bold text-sm text-foreground leading-none">Kakebe Shop</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Admin Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {navSections.map((section) => {
          const visibleRoutes = section.paths.filter(p => {
            if (p === 'role-management') return true
            return availablePaths.has(p)
          })
          if (visibleRoutes.length === 0) return null

          return (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  {section.label}
                </p>
              )}
              {collapsed && <div className="my-2 border-t border-border/50" />}
              {visibleRoutes.map(path => {
                const route = dashboardRoutes.find(r => r.path === path)
                const label = route?.label ?? (path === 'role-management' ? 'Role Management' : path)
                const Icon = iconMap[path] ?? MdDashboard
                const to = path === '' ? '/' : `/${path}`
                const isEnd = path === ''
                const isLive = path === 'live-orders'

                return (
                  <NavLink
                    key={path}
                    to={to}
                    end={isEnd}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 relative group',
                        collapsed ? 'justify-center px-2' : '',
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                          : isLive
                            ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )
                    }
                  >
                    <Icon className={cn('h-[18px] w-[18px] flex-shrink-0', isLive && 'animate-pulse')} />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{label}</span>
                        {isLive && newOrderCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1">
                            {newOrderCount > 99 ? '99+' : newOrderCount}
                          </span>
                        )}
                        {route?.comingSoon && (
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground/50 font-medium">Soon</span>
                        )}
                      </>
                    )}
                    {/* Collapsed badge for live orders */}
                    {collapsed && isLive && newOrderCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive border-2 border-card" />
                    )}
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={onToggle}
          className={cn(
            'flex w-full items-center rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <><ChevronLeft className="h-4 w-4 mr-2" /><span>Collapse sidebar</span></>}
        </button>
      </div>
    </aside>
  )
}
