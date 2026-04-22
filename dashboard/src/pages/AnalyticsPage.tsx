import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { fetchListings } from '@/api/listings'
import { fetchMerchants } from '@/api/merchants'
import { fetchOrders } from '@/api/orders'
import apiClient from '@/api/client'
import { KPICard } from '@/components/shared/KPICard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Store, ListChecks, CheckCircle, ShoppingBag, Users, XCircle, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'

const PIE_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444']
const CHART_STYLE = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }

interface AdminStats {
  total_users: number
  active_users: number
  staff_users: number
  total_merchants: number
  verified_merchants: number
  pending_merchants: number
  total_listings: number
  active_listings: number
  pending_listings: number
  total_orders: number
  new_orders: number
  completed_orders: number
  cancelled_orders: number
  total_categories: number
  total_images: number
}

// Build last N days labels
function lastNDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().split('T')[0]
  })
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<7 | 14 | 30>(7)

  // Admin stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/admin/stats/')
      const raw = res.data as any
      return (raw.data ?? raw) as AdminStats
    },
    staleTime: 60_000,
  })

  // Orders by date range for daily chart
  const days = lastNDays(dateRange)
  const dateFrom = days[0]
  const dateTo = days[days.length - 1]

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['analytics-orders', dateFrom, dateTo],
    queryFn: () => fetchOrders({ date_from: dateFrom, date_to: dateTo, ordering: 'created_at' }),
    staleTime: 60_000,
  })

  const results = useQueries({
    queries: [
      { queryKey: ['analytics', 'products'], queryFn: () => fetchListings({ listing_type: 'PRODUCT' }), staleTime: 120_000 },
      { queryKey: ['analytics', 'services'], queryFn: () => fetchListings({ listing_type: 'SERVICE' }), staleTime: 120_000 },
      { queryKey: ['analytics', 'merchants-all'], queryFn: () => fetchMerchants({ page: 1 }), staleTime: 120_000 },
    ],
  })

  const [products, services, allMerchants] = results
  const isLoading = statsLoading || results.some(r => r.isLoading)

  const stats = statsData
  const productCount = products.data?.count ?? 0
  const serviceCount = services.data?.count ?? 0
  const totalMerchants = allMerchants.data?.count ?? 0

  // Build daily orders chart data
  const dailyOrdersMap: Record<string, number> = {}
  days.forEach(d => { dailyOrdersMap[d] = 0 })
  ;(ordersData?.results ?? []).forEach(order => {
    const day = order.created_at.split('T')[0]
    if (dailyOrdersMap[day] !== undefined) dailyOrdersMap[day]++
  })
  const dailyOrdersData = days.map(d => ({
    date: d.slice(5), // MM-DD
    orders: dailyOrdersMap[d],
  }))

  // Order status breakdown
  const orderStatusData = stats ? [
    { name: 'New', value: stats.new_orders },
    { name: 'Completed', value: stats.completed_orders },
    { name: 'Cancelled', value: stats.cancelled_orders },
    { name: 'Other', value: Math.max(0, stats.total_orders - stats.new_orders - stats.completed_orders - stats.cancelled_orders) },
  ].filter(d => d.value > 0) : []

  const listingTypeData = [
    { name: 'Products', value: productCount },
    { name: 'Services', value: serviceCount },
  ]

  const merchantData = stats ? [
    { name: 'Verified', value: stats.verified_merchants },
    { name: 'Pending', value: stats.pending_merchants },
    { name: 'Other', value: Math.max(0, totalMerchants - stats.verified_merchants - stats.pending_merchants) },
  ].filter(d => d.value > 0) : []

  return (
    <div className="space-y-6">
      {/* KPI Grid from admin stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Orders" value={stats?.total_orders ?? '—'} icon={ShoppingBag} color="amber" loading={isLoading} />
        <KPICard label="New Orders" value={stats?.new_orders ?? '—'} icon={Clock} color="blue" loading={isLoading} />
        <KPICard label="Total Merchants" value={stats?.total_merchants ?? '—'} icon={Store} color="green" loading={isLoading} />
        <KPICard label="Total Users" value={stats?.total_users ?? '—'} icon={Users} color="purple" loading={isLoading} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Listings" value={stats?.total_listings ?? '—'} icon={ListChecks} color="amber" loading={isLoading} />
        <KPICard label="Active Listings" value={stats?.active_listings ?? '—'} icon={CheckCircle} color="green" loading={isLoading} />
        <KPICard label="Pending Listings" value={stats?.pending_listings ?? '—'} icon={TrendingUp} color="blue" loading={isLoading} />
        <KPICard label="Cancelled Orders" value={stats?.cancelled_orders ?? '—'} icon={XCircle} color="slate" loading={isLoading} />
      </div>

      {/* Daily Orders Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Orders by Day</CardTitle>
          <div className="flex gap-2">
            {([7, 14, 30] as const).map(d => (
              <Button key={d} size="sm" variant={dateRange === d ? 'default' : 'outline'} onClick={() => setDateRange(d)}>
                {d}d
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyOrdersData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={CHART_STYLE} />
                <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Order Status Breakdown */}
        <Card>
          <CardHeader><CardTitle>Order Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, percent }) => `${name} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}>
                  {orderStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={CHART_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Listing Types */}
        <Card>
          <CardHeader><CardTitle>Listing Types</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={listingTypeData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, percent }) => `${name} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}>
                  {listingTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={CHART_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Merchant Verification */}
        <Card>
          <CardHeader><CardTitle>Merchant Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={merchantData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, percent }) => `${name} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}>
                  {merchantData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={CHART_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Listings & Merchants Bar */}
      <Card>
        <CardHeader><CardTitle>Platform Overview</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[
              { name: 'Total Listings', count: stats?.total_listings ?? 0 },
              { name: 'Active', count: stats?.active_listings ?? 0 },
              { name: 'Pending', count: stats?.pending_listings ?? 0 },
              { name: 'Total Merchants', count: stats?.total_merchants ?? 0 },
              { name: 'Verified', count: stats?.verified_merchants ?? 0 },
              { name: 'Total Users', count: stats?.total_users ?? 0 },
              { name: 'Active Users', count: stats?.active_users ?? 0 },
            ]} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={CHART_STYLE} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
