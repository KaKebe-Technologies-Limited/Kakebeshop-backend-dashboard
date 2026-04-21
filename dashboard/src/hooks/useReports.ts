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
  fetchListingReviews,
  fetchMerchantReviews,
  fetchMerchantScores,
  deleteListingReview,
  deleteMerchantReview,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchPushTokens,
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

export function useListingReviews(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.listingReviews.list(params),
    queryFn: () => fetchListingReviews(params),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}

export function useMerchantReviews(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.merchantReviews.list(params),
    queryFn: () => fetchMerchantReviews(params),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}

export function useMerchantScores(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.merchantScores.list(params),
    queryFn: () => fetchMerchantScores(params),
    placeholderData: prev => prev,
    staleTime: 60_000,
  })
}

export function useNotifications(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => fetchNotifications(params),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}

export function usePushTokens() {
  return useQuery({
    queryKey: queryKeys.pushTokens.list(),
    queryFn: fetchPushTokens,
    staleTime: 60_000,
  })
}

export function useNotificationMutations() {
  const qc = useQueryClient()

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })

  return {
    markRead: markRead.mutateAsync,
    markAllRead: markAllRead.mutateAsync,
    isMarkingRead: markRead.isPending,
    isMarkingAll: markAllRead.isPending,
  }
}

export function useReviewMutations() {
  const qc = useQueryClient()

  const removeListing = useMutation({
    mutationFn: deleteListingReview,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.listingReviews.all })
    },
  })

  const removeMerchant = useMutation({
    mutationFn: deleteMerchantReview,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.merchantReviews.all })
    },
  })

  return {
    deleteListingReview: removeListing.mutateAsync,
    deleteMerchantReview: removeMerchant.mutateAsync,
    isDeletingListing: removeListing.isPending,
    isDeletingMerchant: removeMerchant.isPending,
  }
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
