import apiClient from './client'
import type {
  DailyAnalyticsSnapshot,
  MerchantPerformance,
  OrderHealth,
  UserEngagement,
  PaginatedResponse,
} from '@/types'

interface BackendResponse<T> {
  success: boolean
  data: T
}

export async function fetchDailyAnalytics(days: number = 7) {
  const res = await apiClient.get<BackendResponse<DailyAnalyticsSnapshot[]>>(
    '/api/v1/admin/analytics/daily/',
    { params: { days } }
  )
  const raw = res.data as any
  return (raw.data ?? raw) as DailyAnalyticsSnapshot[]
}

export async function fetchMerchantPerformance(period: 'daily' | 'weekly') {
  const res = await apiClient.get<BackendResponse<MerchantPerformance>>(
    '/api/v1/admin/analytics/merchants/',
    { params: { period } }
  )
  const raw = res.data as any
  return (raw.data ?? raw) as MerchantPerformance
}

export async function fetchOrderHealth(period: 'daily' | 'weekly') {
  const res = await apiClient.get<BackendResponse<OrderHealth>>(
    '/api/v1/admin/analytics/order_health/',
    { params: { period } }
  )
  const raw = res.data as any
  return (raw.data ?? raw) as OrderHealth
}

export async function fetchUserEngagement(period: 'daily' | 'weekly') {
  const res = await apiClient.get<BackendResponse<UserEngagement>>(
    '/api/v1/admin/analytics/user_engagement/',
    { params: { period } }
  )
  const raw = res.data as any
  return (raw.data ?? raw) as UserEngagement
}
