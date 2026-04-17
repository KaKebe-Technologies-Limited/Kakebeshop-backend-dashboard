import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGuard } from '@/components/layout/RoleGuard'
import LoginPage from '@/pages/LoginPage'
import OverviewPage from '@/pages/OverviewPage'
import OrdersPage from '@/pages/OrdersPage'
import MerchantsPage from '@/pages/MerchantsPage'
import ListingsPage from '@/pages/ListingsPage'
import CategoriesPage from '@/pages/CategoriesPage'
import TagsPage from '@/pages/TagsPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import ReportsPage from '@/pages/ReportsPage'
import TransactionsPage from '@/pages/TransactionsPage'
import BannersPage from '@/pages/BannersPage'
import AuditLogsPage from '@/pages/AuditLogsPage'
import ConversationsPage from '@/pages/ConversationsPage'
import UserRegistrationsPage from '@/pages/UserRegistrationsPage'
import VisitorAnalyticsPage from '@/pages/VisitorAnalyticsPage'
import RoleManagementPage from '@/pages/RoleManagementPage'
import ImageLibraryPage from '@/pages/ImageLibraryPage'
import ComingSoonPage from '@/pages/ComingSoonPage'
import { AppShell } from '@/components/layout/AppShell'
import type { UserRole } from '@/stores/authStore'

interface DashboardRoute {
  path: string
  element: React.ReactNode
  roles?: UserRole[]
  label: string
  icon?: string
  comingSoon?: boolean
}

export const dashboardRoutes: DashboardRoute[] = [
  { path: '', element: <OverviewPage />, roles: ['super_admin', 'admin', 'moderator', 'support'], label: 'Overview' },
  { path: 'orders', element: <OrdersPage />, roles: ['super_admin', 'admin', 'moderator'], label: 'Orders' },
  { path: 'merchants', element: <MerchantsPage />, roles: ['super_admin', 'admin', 'moderator'], label: 'Merchants' },
  { path: 'listings', element: <ListingsPage />, roles: ['super_admin', 'admin', 'moderator'], label: 'Listings' },
  { path: 'categories', element: <CategoriesPage />, roles: ['super_admin', 'admin'], label: 'Categories' },
  { path: 'tags', element: <TagsPage />, roles: ['super_admin', 'admin'], label: 'Tags' },
  { path: 'image-library', element: <ImageLibraryPage />, roles: ['super_admin', 'admin'], label: 'Image Library' },
  { path: 'analytics', element: <AnalyticsPage />, roles: ['super_admin', 'admin', 'moderator'], label: 'Analytics' },
  { path: 'reports', element: <ReportsPage />, roles: ['super_admin', 'admin', 'moderator', 'support'], label: 'Reports' },
  { path: 'transactions', element: <TransactionsPage />, roles: ['super_admin', 'admin'], label: 'Transactions' },
  { path: 'banners', element: <BannersPage />, roles: ['super_admin', 'admin'], label: 'Banners' },
  { path: 'audit-logs', element: <AuditLogsPage />, roles: ['super_admin', 'admin'], label: 'Audit Logs' },
  { path: 'conversations', element: <ConversationsPage />, roles: ['super_admin', 'admin', 'moderator', 'support'], label: 'Conversations' },
  { path: 'user-registrations', element: <UserRegistrationsPage />, roles: ['super_admin', 'admin'], label: 'User Registrations' },
  { path: 'visitor-analytics', element: <VisitorAnalyticsPage />, roles: ['super_admin', 'admin'], label: 'Visitor Analytics' },
  { path: 'role-management', element: <RoleManagementPage />, roles: ['super_admin', 'admin'], label: 'Role Management' },
  { path: 'settings', element: <ComingSoonPage title="Settings" description="Dashboard settings coming soon." />, roles: ['super_admin', 'admin'], label: 'Settings', comingSoon: true },
  { path: 'help', element: <ComingSoonPage title="Help & Support" description="Help center coming soon." />, roles: ['super_admin', 'admin', 'moderator', 'support'], label: 'Help', comingSoon: true },
  { path: 'customers', element: <ComingSoonPage title="Customers" description="Customer management coming soon." />, roles: ['super_admin', 'admin', 'moderator'], label: 'Customers', comingSoon: true },
  { path: 'staff', element: <ComingSoonPage title="Staff Management" description="Staff management coming soon." />, roles: ['super_admin', 'admin'], label: 'Staff', comingSoon: true },
  { path: 'payouts', element: <ComingSoonPage title="Payouts" description="Payout management coming soon." />, roles: ['super_admin', 'admin'], label: 'Payouts', comingSoon: true },
  { path: 'coupons', element: <ComingSoonPage title="Coupons" description="Coupon management coming soon." />, roles: ['super_admin', 'admin'], label: 'Coupons', comingSoon: true },
  { path: 'reviews', element: <ComingSoonPage title="Reviews" description="Review moderation coming soon." />, roles: ['super_admin', 'admin', 'moderator'], label: 'Reviews', comingSoon: true },
]

function buildRoutes(routes: DashboardRoute[]): RouteObject[] {
  return routes.map(({ path, element, roles, comingSoon }) => ({
    path,
    element: comingSoon
      ? element
      : <RoleGuard allowedRoles={roles ?? ['admin']}>{element}</RoleGuard>,
  }))
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: buildRoutes(dashboardRoutes),
  },
  {
    path: '*',
    element: (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background p-8">
        <div className="rounded-full bg-muted p-6">
          <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">404</h1>
          <p className="text-lg text-muted-foreground mt-1">Page not found</p>
          <a href="/" className="mt-4 inline-block text-primary hover:underline">Go back home</a>
        </div>
      </div>
    ),
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
