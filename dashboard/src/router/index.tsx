import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from './ProtectedRoute'

// Eager-loaded (public data, used on first visit)
import LoginPage from '@/pages/LoginPage'
import OverviewPage from '@/pages/OverviewPage'
import MerchantsPage from '@/pages/MerchantsPage'
import ListingsPage from '@/pages/ListingsPage'
import CategoriesPage from '@/pages/CategoriesPage'
import TagsPage from '@/pages/TagsPage'

// Lazy-loaded (auth-gated or heavy)
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const BannersPage = lazy(() => import('@/pages/BannersPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'))
const ConversationsPage = lazy(() => import('@/pages/ConversationsPage'))
const ComingSoonPage = lazy(() => import('@/pages/ComingSoonPage'))

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute><AppShell /></ProtectedRoute>,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'merchants', element: <MerchantsPage /> },
      { path: 'listings', element: <ListingsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'tags', element: <TagsPage /> },
      { path: 'orders', element: <PageSuspense><OrdersPage /></PageSuspense> },
      { path: 'transactions', element: <PageSuspense><TransactionsPage /></PageSuspense> },
      { path: 'reports', element: <PageSuspense><ReportsPage /></PageSuspense> },
      { path: 'banners', element: <PageSuspense><BannersPage /></PageSuspense> },
      { path: 'analytics', element: <PageSuspense><AnalyticsPage /></PageSuspense> },
      { path: 'audit-logs', element: <PageSuspense><AuditLogsPage /></PageSuspense> },
      { path: 'conversations', element: <PageSuspense><ConversationsPage /></PageSuspense> },
      { path: 'customers', element: <PageSuspense><ComingSoonPage /></PageSuspense> },
      { path: 'staff', element: <PageSuspense><ComingSoonPage /></PageSuspense> },
      { path: 'payouts', element: <PageSuspense><ComingSoonPage /></PageSuspense> },
      { path: 'coupons', element: <PageSuspense><ComingSoonPage /></PageSuspense> },
      { path: 'reviews', element: <PageSuspense><ComingSoonPage /></PageSuspense> },
      { path: 'settings', element: <PageSuspense><ComingSoonPage /></PageSuspense> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
