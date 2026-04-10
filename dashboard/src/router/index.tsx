import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
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
import ComingSoonPage from '@/pages/ComingSoonPage'
import { AppShell } from '@/components/layout/AppShell'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <OverviewPage />,
      },
      {
        path: 'overview',
        element: <OverviewPage />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'merchants',
        element: <MerchantsPage />,
      },
      {
        path: 'listings',
        element: <ListingsPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
      {
        path: 'tags',
        element: <TagsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'transactions',
        element: <TransactionsPage />,
      },
      {
        path: 'banners',
        element: <BannersPage />,
      },
      {
        path: 'audit-logs',
        element: <AuditLogsPage />,
      },
      {
        path: 'conversations',
        element: <ConversationsPage />,
      },
      {
        path: 'user-registrations',
        element: <UserRegistrationsPage />,
      },
      {
        path: 'visitor-analytics',
        element: <VisitorAnalyticsPage />,
      },
      {
        path: 'settings',
        element: <ComingSoonPage title="Settings" />,
      },
      {
        path: 'help',
        element: <ComingSoonPage title="Help & Support" />,
      },
    ],
  },
  {
    path: '*',
    element: <ComingSoonPage title="Page Not Found" />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
