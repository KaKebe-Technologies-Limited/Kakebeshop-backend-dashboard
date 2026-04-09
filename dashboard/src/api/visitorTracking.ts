import apiClient from './client'

interface PageView {
  page_url: string
  page_title: string
  product_id: string | null
  timestamp: string
}

interface VisitorAnalytics {
  total_visitors: number
  page_views: number
  bot_percentage: number
  top_pages: Array<{ url: string; views: number }>
  top_products: Array<{ id: string; title: string; views: number }>
}

interface RealtimeVisitor {
  session_id: string
  ip_address: string
  current_page: string
  entry_time: string
  is_bot: boolean
}

export async function fetchVisitorAnalytics(): Promise<VisitorAnalytics> {
  const response = await apiClient.get('/analytics/visitors')
  return response.data
}

export async function fetchRealtimeVisitors(): Promise<RealtimeVisitor[]> {
  const response = await apiClient.get('/analytics/visitors/realtime')
  return response.data
}

export async function trackVisitorActivity(sessionId: string, pageView: PageView): Promise<void> {
  await apiClient.post('/analytics/visitors/track', {
    session_id: sessionId,
    ...pageView
  })
}
