import { useQuery } from '@tanstack/react-query'
import { fetchReports, fetchTransactions, fetchBanners, fetchAuditLogs, fetchUnreadCount } from '@/api/reports'
import { queryKeys } from '@/lib/queryKeys'

export function useReports(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.reports.list(params),
    queryFn: () => fetchReports(params),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}

export function useTransactions(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => fetchTransactions(params),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}

export function useBanners(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.banners.list(params),
    queryFn: () => fetchBanners(params),
    placeholderData: prev => prev,
    staleTime: 60_000,
  })
}

export function useAuditLogs(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(params),
    queryFn: () => fetchAuditLogs(params),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
