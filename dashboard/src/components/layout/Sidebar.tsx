import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Store, ListChecks, Tag, FolderTree,
  ShoppingBag, BarChart3, Flag, CreditCard, Image, MessageSquare,
  ScrollText, ChevronLeft, ChevronRight, Users, UserCog,
  Banknote, Ticket, Star, Settings, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboardRoutes } from '@/router'
import { useAuthStore } from '@/stores/authStore'

// Map route paths to icons (overrides icon string from route config)
const iconMap: Record<string, React.ElementType> = {
  '': LayoutDashboard,
  'orders': ShoppingBag,
  'merchants': Store,
  'listings': ListChecks,
  'categories': FolderTree,
  'tags': Tag,
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
}

// Group route paths into sections
const navSections = [
  { label: 'General', paths: ['', 'overview'] },
  { label: 'Catalog', paths: ['merchants', 'listings', 'categories', 'tags'] },
  { label: 'Users', paths: ['customers', 'staff', 'user-registrations', 'role-management'] },
  { label: 'Commerce', paths: ['orders', 'transactions', 'payouts', 'coupons'] },
  { label: 'Trust & Safety', paths: ['reviews', 'reports'] },
  { label: 'Content', paths: ['banners', 'conversations'] },
  { label: 'Insights', paths: ['analytics', 'visitor-analytics', 'audit-logs'] },
  { label: 'Other', paths: ['settings', 'help'] },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const role = useAuthStore(s => s.role)
  const hasPermissionFn = useAuthStore(s => s.hasPermission)

  // Build a set of available route paths for the current role
  const availablePaths = new Set(
    dashboardRoutes
      .filter(r => r.roles?.includes(role))
      .map(r => r.path)
  )

  // Check if role-management should be shown
  const showRoleManagement = hasPermissionFn('manage_roles')

  return (
    <aside
      className={cn(
        'flex flex-col bg-card border-r border-border transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
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
          // Filter paths that exist in routes and are available for this role
          const visibleRoutes = section.paths.filter(p => {
            if (p === 'role-management') return showRoleManagement
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
                if (path === 'role-management') {
                  return (
                    <NavLink
                      key={path}
                      to="/role-management"
                      title={collapsed ? 'Role Management' : undefined}
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
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">Role Management</span>}
                    </NavLink>
                  )
                }

                const route = dashboardRoutes.find(r => r.path === path)
                if (!route) return null

                const Icon = iconMap[path] ?? LayoutDashboard
                const to = path === '' ? '/' : `/${path}`
                const isEnd = path === ''

                return (
                  <NavLink
                    key={path}
                    to={to}
                    end={isEnd}
                    title={collapsed ? route.label : undefined}
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
                        <span className="truncate">{route.label}</span>
                        {route.comingSoon && (
                          <span className="ml-auto text-[9px] uppercase tracking-wide text-muted-foreground/60 font-medium">
                            Soon
                          </span>
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
          className={cn(
            'flex w-full items-center rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
            collapsed && 'justify-center px-2',
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
