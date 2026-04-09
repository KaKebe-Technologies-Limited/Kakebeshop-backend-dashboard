import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchVisitorAnalytics, fetchRealtimeVisitors, trackVisitorActivity } from '@/api/visitorTracking'
import { ntfyService } from '@/services/ntfyService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RefreshCw, Eye, Bot, Users, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export default function VisitorAnalyticsPage() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15))
  const [currentPage, setCurrentPage] = useState(window.location.pathname)

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['visitorAnalytics'],
    queryFn: () => fetchVisitorAnalytics(),
  })

  const { data: realtimeVisitors, refetch: refetchRealtime } = useQuery({
    queryKey: ['realtimeVisitors'],
    queryFn: () => fetchRealtimeVisitors(),
  })

  // Track page views
  useEffect(() => {
    const pageView = {
      page_url: window.location.href,
      page_title: document.title,
      product_id: null,
      timestamp: new Date().toISOString()
    }

    // Track visitor activity
    trackVisitorActivity(sessionId, pageView)

    // Send ntfy notification for page view
    ntfyService.notifyPageView(pageView.page_url, navigator.userAgent)

    // Update current page
    setCurrentPage(window.location.pathname)
  }, [sessionId])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const getBotPercentageColor = (percentage: number) => {
    if (percentage > 50) return 'destructive'
    if (percentage > 25) return 'secondary'
    return 'default'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visitor Analytics</h1>
          <p className="text-muted-foreground">Real-time visitor tracking and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            refetchAnalytics()
            refetchRealtime()
          }}>
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
            <div className="text-2xl font-bold">{formatNumber(realtimeVisitors?.length || 0)}</div>
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
            <div className="text-2xl font-bold">{analytics?.bot_percentage ?? 0}%</div>
            <Badge variant={getBotPercentageColor(analytics?.bot_percentage ?? 0)}>
              {(analytics?.bot_percentage ?? 0) > 50 ? 'High' : (analytics?.bot_percentage ?? 0) > 25 ? 'Medium' : 'Low'} bot traffic
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
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
                {analytics?.top_pages?.map((page, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium max-w-xs truncate" title={page.url}>
                      {page.url}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(page.views)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
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
                {analytics?.top_products?.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.id}</TableCell>
                    <TableCell className="max-w-xs truncate" title={product.title}>
                      {product.title}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(product.views)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Visitors */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Visitors</CardTitle>
        </CardHeader>
        <CardContent>
          {realtimeVisitors && realtimeVisitors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Current Page</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Is Bot</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realtimeVisitors.map((visitor) => (
                  <TableRow key={visitor.session_id}>
                    <TableCell className="font-mono text-xs">{visitor.session_id}</TableCell>
                    <TableCell>{visitor.ip_address}</TableCell>
                    <TableCell className="max-w-xs truncate" title={visitor.current_page}>
                      {visitor.current_page}
                    </TableCell>
                    <TableCell>
                      {format(new Date(visitor.entry_time), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={visitor.is_bot ? 'destructive' : 'default'}>
                        {visitor.is_bot ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active visitors at the moment
            </div>
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
              <p className="text-sm text-muted-foreground">Session ID</p>
              <p className="font-mono text-sm">{sessionId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Page</p>
              <p className="font-medium">{currentPage}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Is Bot</p>
              <Badge variant={ntfyService.isBot(navigator.userAgent) ? 'destructive' : 'default'}>
                {ntfyService.isBot(navigator.userAgent) ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
