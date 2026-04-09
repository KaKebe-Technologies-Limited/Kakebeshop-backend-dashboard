import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Store, ListChecks, Tag, FolderTree,
  ShoppingBag, BarChart3, Flag, CreditCard, Image, MessageSquare,
  ScrollText, ChevronLeft, ChevronRight, Users, UserCog,
  Banknote, Ticket, Star, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Overview', to: '/', icon: LayoutDashboard, end: true },

  { type: 'divider', label: 'Catalog' },
  { label: 'Merchants', to: '/merchants', icon: Store },
  { label: 'Listings', to: '/listings', icon: ListChecks },
  { label: 'Categories', to: '/categories', icon: FolderTree },
  { label: 'Tags', to: '/tags', icon: Tag },

  { type: 'divider', label: 'Users' },
  { label: 'Customers', to: '/customers', icon: Users },
  { label: 'Staff', to: '/staff', icon: UserCog },

  { type: 'divider', label: 'Commerce' },
  { label: 'Orders', to: '/orders', icon: ShoppingBag },
  { label: 'Transactions', to: '/transactions', icon: CreditCard },
  { label: 'Payouts', to: '/payouts', icon: Banknote },
  { label: 'Coupons', to: '/coupons', icon: Ticket },

  { type: 'divider', label: 'Trust & Safety' },
  { label: 'Reviews', to: '/reviews', icon: Star },
  { label: 'Reports', to: '/reports', icon: Flag },

  { type: 'divider', label: 'Content' },
  { label: 'Banners', to: '/banners', icon: Image },
  { label: 'Conversations', to: '/conversations', icon: MessageSquare },

  { type: 'divider', label: 'Insights' },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Audit Logs', to: '/audit-logs', icon: ScrollText },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
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
        {navItems.map((item, i) => {
          if ('type' in item) {
            return collapsed ? (
              <div key={i} className="my-2 border-t border-border" />
            ) : (
              <p key={i} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {item.label}
              </p>
            )
          }

          const Icon = item.icon!
          return (
            <NavLink
              key={item.to}
              to={item.to!}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  collapsed ? 'justify-center px-2' : '',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Settings + Collapse */}
      <div className="border-t border-border p-2 space-y-0.5">
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
              collapsed ? 'justify-center px-2' : '',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
          }
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
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
