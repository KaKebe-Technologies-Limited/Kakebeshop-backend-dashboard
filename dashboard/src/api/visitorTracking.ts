import apiClient from './client'

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

// The live backend has no dedicated visitor-tracking endpoints.
// We use activity-logs as the closest available data source.
export async function fetchVisitorAnalytics(): Promise<VisitorAnalytics> {
  try {
    const res = await apiClient.get<{ count: number; results: Array<{ activity_type: string; metadata?: Record<string, unknown>; ip_address?: string }> }>(
      '/api/v1/activity-logs/',
      { params: { page_size: 100 } }
    )
    const results = res.data.results ?? []
    const pageViews = results.filter(r => r.activity_type === 'VIEW_LISTING').length
    return {
      total_visitors: res.data.count ?? 0,
      page_views: pageViews,
      bot_percentage: 0,
      top_pages: [],
      top_products: [],
    }
  } catch {
    return { total_visitors: 0, page_views: 0, bot_percentage: 0, top_pages: [], top_products: [] }
  }
}

export async function fetchRealtimeVisitors(): Promise<RealtimeVisitor[]> {
  // No realtime endpoint exists — return empty
  return []
}

export async function trackVisitorActivity(_sessionId: string, _pageView: unknown): Promise<void> {
  // No tracking endpoint exists in the live API
}
