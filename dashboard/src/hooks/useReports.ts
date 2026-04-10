import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchReports,
  fetchTransactions,
  fetchBanners,
  fetchAuditLogs,
  fetchUnreadCount,
  createBanner,
  updateBanner,
  deleteBanner,
} from '@/api/reports'
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

export function useBannerMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: createBanner,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.banners.all })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateBanner>[1] }) => updateBanner(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.banners.all })
    },
  })

  const remove = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.banners.all })
    },
  })

  return {
    createBanner: create.mutateAsync,
    updateBanner: update.mutateAsync,
    deleteBanner: remove.mutateAsync,
    isCreatingBanner: create.isPending,
    isUpdatingBanner: update.isPending,
    isDeletingBanner: remove.isPending,
  }
}
