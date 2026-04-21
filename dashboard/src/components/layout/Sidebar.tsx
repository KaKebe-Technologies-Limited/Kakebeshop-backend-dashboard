import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Store, ListChecks, Tag, FolderTree,
  ShoppingBag, BarChart3, Flag, CreditCard, Image, MessageSquare,
  ScrollText, ChevronLeft, ChevronRight, Users, UserCog,
  Banknote, Ticket, Star, Settings, Shield, Images, ShoppingCart, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboardRoutes } from '@/router'

const iconMap: Record<string, React.ElementType> = {
  '': LayoutDashboard,
  'orders': ShoppingBag,
  'merchants': Store,
  'listings': ListChecks,
  'categories': FolderTree,
  'tags': Tag,
  'image-library': Images,
  'analytics': BarChart3,
  'reports': Flag,
  'transactions': CreditCard,
  'banners': Image,
  'audit-logs': ScrollText,
  'conversations': MessageSquare,
  'user-registrations': Users,
  'visitor-analytics': BarChart3,
  'settings': Settings,
  'help': Settings,
  'customers': Users,
  'staff': UserCog,
  'payouts': Banknote,
  'coupons': Ticket,
  'reviews': Star,
  'role-management': Shield,
  'cart-wishlist': ShoppingCart,
  'notifications': Bell,
}

const navSections = [
  { label: 'General', paths: ['', 'overview'] },
  { label: 'Catalog', paths: ['merchants', 'listings', 'categories', 'tags'] },
  { label: 'Media', paths: ['image-library', 'banners'] },
  { label: 'Users', paths: ['customers', 'staff', 'user-registrations', 'role-management'] },
  { label: 'Commerce', paths: ['orders', 'transactions', 'payouts', 'coupons', 'cart-wishlist'] },
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

  return (
    <aside className={cn('flex flex-col bg-card border-r border-border transition-all duration-200 flex-shrink-0', collapsed ? 'w-16' : 'w-56')}>
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 py-5 border-b border-border', collapsed && 'justify-center px-2')}>
        <img src="/kakebe-shop.png" alt="Kakebe Shop" className="flex-shrink-0 h-8 w-8 rounded-lg object-cover" />
        {!collapsed && (
          <span className="font-semibold text-foreground text-sm leading-tight">
            Kakebe Shop<br />
            <span className="text-xs font-normal text-muted-foreground">Admin</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navSections.map((section) => {
          const visibleRoutes = section.paths.filter(p => {
            if (p === 'role-management') return true
            return availablePaths.has(p)
          })
          if (visibleRoutes.length === 0) return null

          return (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              {collapsed && <div className="my-2 border-t border-border" />}
              {visibleRoutes.map(path => {
                const route = dashboardRoutes.find(r => r.path === path)
                const label = route?.label ?? (path === 'role-management' ? 'Role Management' : path)
                const Icon = iconMap[path] ?? LayoutDashboard
                const to = path === '' ? '/' : `/${path}`
                const isEnd = path === ''

                return (
                  <NavLink
                    key={path}
                    to={to}
                    end={isEnd}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors relative',
                        collapsed ? 'justify-center px-2' : '',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )
                    }
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{label}</span>
                        {route?.comingSoon && (
                          <span className="ml-auto text-[9px] uppercase tracking-wide text-muted-foreground/60 font-medium">Soon</span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Collapse */}
      <div className="border-t border-border p-2">
        <button
          onClick={onToggle}
          className={cn('flex w-full items-center rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors', collapsed && 'justify-center px-2')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4 mr-2" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  )
}
