import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchVisitorAnalytics, fetchRealtimeVisitors, trackVisitorActivity } from '@/api/visitorTracking'
import { ntfyService } from '@/services/ntfyService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { RefreshCw, Eye, Bot, Users, TrendingUp, BarChart3, Clock, Monitor, Globe, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

export default function VisitorAnalyticsPage() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15))
  const [currentPage, setCurrentPage] = useState(window.location.pathname)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')

  const { data: analytics, refetch: refetchAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['visitorAnalytics'],
    queryFn: () => fetchVisitorAnalytics(),
  })

  const { data: realtimeVisitors, refetch: refetchRealtime, isLoading: realtimeLoading } = useQuery({
    queryKey: ['realtimeVisitors'],
    queryFn: () => fetchRealtimeVisitors(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: hourlyData, isLoading: hourlyLoading } = useQuery({
    queryKey: ['visitorHourlyAnalytics', timeRange],
    queryFn: async () => {
      // This would call a backend endpoint for hourly data
      // For now, we'll generate mock data based on analytics
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 * 24 : 30 * 24
      const baseCount = (analytics?.page_views ?? 1000) / hours
      
      return Array.from({ length: Math.min(hours, 24) }, (_, i) => {
        const hour = new Date().getHours() - (Math.min(hours, 24) - 1 - i)
        const variation = Math.random() * 0.5 + 0.75 // 0.75 to 1.25
        return {
          time: `${((hour % 24) + 24) % 24}:00`,
          visitors: Math.round(baseCount * variation),
          page_views: Math.round(baseCount * variation * 1.5),
          bots: Math.round(baseCount * variation * (analytics?.bot_percentage ?? 20) / 100)
        }
      })
    },
    enabled: !!analytics,
  })

  // Track page views
  useEffect(() => {
    const pageView = {
      page_url: window.location.href,
      page_title: document.title,
      product_id: null,
      timestamp: new Date().toISOString()
    }

    trackVisitorActivity(sessionId, pageView)

    if (!ntfyService.isBot(navigator.userAgent)) {
      void ntfyService.notifyPageView(pageView.page_url, navigator.userAgent)
    }

    setCurrentPage(window.location.pathname)
  }, [sessionId])

  const handleRefresh = () => {
    refetchAnalytics()
    refetchRealtime()
  }

  const formatNumber = (num: number) => new Intl.NumberFormat().format(num)

  const getBotPercentageColor = (percentage: number) => {
    if (percentage > 50) return 'destructive'
    if (percentage > 25) return 'secondary'
    return 'default'
  }

  // Prepare device breakdown data (mock)
  const deviceData = [
    { name: 'Desktop', value: Math.round((analytics?.total_visitors ?? 0) * 0.55) },
    { name: 'Mobile', value: Math.round((analytics?.total_visitors ?? 0) * 0.35) },
    { name: 'Tablet', value: Math.round((analytics?.total_visitors ?? 0) * 0.1) },
  ]

  // Prepare geographic data (mock)
  const geoData = [
    { country: 'Uganda', visitors: Math.round((analytics?.total_visitors ?? 0) * 0.65) },
    { country: 'Kenya', visitors: Math.round((analytics?.total_visitors ?? 0) * 0.15) },
    { country: 'Tanzania', visitors: Math.round((analytics?.total_visitors ?? 0) * 0.1) },
    { country: 'Other', visitors: Math.round((analytics?.total_visitors ?? 0) * 0.1) },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Visitor Analytics
          </h1>
          <p className="text-muted-foreground mt-0.5">Real-time visitor tracking and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(['24h', '7d', '30d'] as const).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
              >
                {range}
              </Button>
            ))}
          </div>
          <Badge variant="secondary" className="text-sm">
            {formatNumber(analytics?.total_visitors || 0)} total visitors
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh} loading={analyticsLoading || realtimeLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics?.total_visitors || 0)}</div>
            <p className="text-xs text-muted-foreground">All time visitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realtimeLoading ? (
                <div className="h-8 w-16 rounded shimmer" />
              ) : (
                formatNumber(realtimeVisitors?.length || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics?.page_views || 0)}</div>
            <p className="text-xs text-muted-foreground">Total page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bot Traffic</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.bot_percentage?.toFixed(1) ?? 0}%</div>
            <Badge variant={getBotPercentageColor(analytics?.bot_percentage ?? 0)}>
              {(analytics?.bot_percentage ?? 0) > 50 ? 'High' : (analytics?.bot_percentage ?? 0) > 25 ? 'Medium' : 'Low'} bot traffic
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Trends Chart */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Visitor Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hourlyLoading ? (
            <div className="h-64 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    const hour = parseInt(value.split(':')[0])
                    return `${hour % 12 || 12}${hour >= 12 ? ' PM' : ' AM'}`
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="visitors" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Visitors" />
                <Area type="monotone" dataKey="page_views" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Page Views" />
                <Area type="monotone" dataKey="bots" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Bot Traffic" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Pages */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page URL</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!analytics?.top_pages?.length ? (
                  <TableEmpty colSpan={2} message="No page view data available." />
                ) : (
                  analytics.top_pages.map((page, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium max-w-xs truncate" title={page.url}>
                        {page.url}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(page.views)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!analytics?.top_products?.length ? (
                  <TableEmpty colSpan={3} message="No product view data available." />
                ) : (
                  analytics.top_products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.id}</TableCell>
                      <TableCell className="max-w-xs truncate" title={product.title}>
                        {product.title}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(product.views)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}
                >
                  {deviceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoData.map((item, index) => {
                const percentage = ((item.visitors / (analytics?.total_visitors ?? 1)) * 100).toFixed(1)
                return (
                  <div key={item.country} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {item.country}
                      </span>
                      <span className="font-medium">{formatNumber(item.visitors)} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bot vs Human */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Bot vs Human
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Humans', value: Math.round((analytics?.total_visitors ?? 0) * (1 - (analytics?.bot_percentage ?? 0) / 100)) },
                    { name: 'Bots', value: Math.round((analytics?.total_visitors ?? 0) * ((analytics?.bot_percentage ?? 0) / 100)) }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Visitors */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Real-time Visitors</CardTitle>
        </CardHeader>
        <CardContent>
          {realtimeLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-3 border-b border-border space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-24 rounded shimmer" />
                  <div className="h-3 w-20 rounded shimmer" />
                </div>
                <div className="h-3 w-32 rounded shimmer" />
              </div>
            ))
          ) : !realtimeVisitors?.length ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="rounded-full bg-muted p-4">
                <Eye className="h-8 w-8 text-muted-foreground opacity-30" />
              </div>
              <div>
                <p className="font-medium text-foreground">No active visitors</p>
                <p className="text-sm text-muted-foreground mt-0.5">No users currently browsing</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Current Page</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Is Bot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realtimeVisitors.map((visitor) => (
                  <TableRow key={visitor.session_id}>
                    <TableCell className="font-mono text-xs">{visitor.session_id}</TableCell>
                    <TableCell className="text-sm">{visitor.ip_address}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm" title={visitor.current_page}>
                      {visitor.current_page}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(visitor.entry_time), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={visitor.is_bot ? 'destructive' : 'default'}>
                        {visitor.is_bot ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Current Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Session ID</p>
              <p className="font-mono text-sm mt-0.5">{sessionId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current Page</p>
              <p className="font-medium mt-0.5">{currentPage}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Is Bot</p>
              <Badge variant={ntfyService.isBot(navigator.userAgent) ? 'destructive' : 'default'} className="mt-1">
                {ntfyService.isBot(navigator.userAgent) ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
