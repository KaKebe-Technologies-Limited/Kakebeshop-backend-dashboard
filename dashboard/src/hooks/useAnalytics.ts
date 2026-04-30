import { useQuery } from '@tanstack/react-query'
import {
  fetchDailyAnalytics,
  fetchMerchantPerformance,
  fetchOrderHealth,
  fetchUserEngagement,
} from '@/api/analytics'
import type {
  DailyAnalyticsSnapshot,
  MerchantPerformance,
  OrderHealth,
  UserEngagement,
} from '@/types'

const ANALYTICS_STALE_TIME = 60 * 60 * 1000 // 1 hour

export function useDailyAnalytics(days: number = 7) {
  return useQuery<DailyAnalyticsSnapshot[]>({
    queryKey: ['analytics', 'daily', days],
    queryFn: () => fetchDailyAnalytics(days),
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useMerchantPerformance(period: 'daily' | 'weekly') {
  return useQuery<MerchantPerformance>({
    queryKey: ['analytics', 'merchants', period],
    queryFn: () => fetchMerchantPerformance(period),
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useOrderHealth(period: 'daily' | 'weekly') {
  return useQuery<OrderHealth>({
    queryKey: ['analytics', 'order-health', period],
    queryFn: () => fetchOrderHealth(period),
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useUserEngagement(period: 'daily' | 'weekly') {
  return useQuery<UserEngagement>({
    queryKey: ['analytics', 'user-engagement', period],
    queryFn: () => fetchUserEngagement(period),
    staleTime: ANALYTICS_STALE_TIME,
  })
}
