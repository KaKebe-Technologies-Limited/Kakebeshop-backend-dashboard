import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { OrderNotifier } from '@/components/OrderNotifier'

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/merchants': 'Merchants',
  '/listings': 'Listings',
  '/categories': 'Categories',
  '/tags': 'Tags',
  '/orders': 'Orders',
  '/transactions': 'Transactions',
  '/reports': 'Content Reports',
  '/banners': 'Banners',
  '/conversations': 'Conversations',
  '/analytics': 'Analytics',
  '/audit-logs': 'Audit Logs',
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'Kakebe Admin'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <OrderNotifier />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
