import apiClient from './client'
import type { Report, Transaction, Banner, PaginatedResponse, AuditLog, ListingReview, MerchantReview, MerchantScore, Notification, PushToken } from '@/types'

// Content Reports — backend only has POST (user-submitted reports), no admin list endpoint
export async function fetchReports(params: Record<string, unknown> = {}) {
  // Reports are user-submitted; the admin list is via audit-logs or activity-logs
  // Fall back to activity-logs which is the closest admin equivalent
  const res = await apiClient.get<PaginatedResponse<Report>>('/api/v1/activity-logs/', { params })
  return res.data
}

// Transactions
export async function fetchTransactions(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<Transaction>>('/api/v1/transactions/', { params })
  return res.data
}

// Banners
export interface BannerPayload {
  title: string
  image: string
  mobile_image?: string
  placement: 'HOME_TOP' | 'HOME_MIDDLE' | 'CATEGORY_TOP' | 'SEARCH_TOP'
  display_type?: 'BANNER' | 'CAROUSEL' | 'AD'
  link_type?: 'NONE' | 'URL' | 'CATEGORY' | 'LISTING' | 'LISTINGS'
  link_url?: string | null
  cta_text?: string
  is_active?: boolean
  start_date?: string | null
  end_date?: string | null
  sort_order?: number
}

export async function fetchBanners(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<Banner>>('/api/v1/banners/', { params })
  return res.data
}

export async function createBanner(payload: BannerPayload) {
  const res = await apiClient.post<Banner>('/api/v1/banners/', payload)
  return res.data
}

export async function updateBanner(id: string, payload: Partial<BannerPayload>) {
  const res = await apiClient.patch<Banner>(`/api/v1/banners/${id}/`, payload)
  return res.data
}

export async function deleteBanner(id: string) {
  await apiClient.delete(`/api/v1/banners/${id}/`)
}

export async function verifyBanner(id: string) {
  const res = await apiClient.post<Banner>(`/api/v1/banners/${id}/verify/`)
  return res.data
}

export async function unverifyBanner(id: string) {
  const res = await apiClient.post<Banner>(`/api/v1/banners/${id}/unverify/`)
  return res.data
}

// Audit Logs
export async function fetchAuditLogs(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<AuditLog>>('/api/v1/audit-logs/', { params })
  return res.data
}

// Reviews
export async function fetchListingReviews(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<ListingReview>>('/api/v1/listing-reviews/', { params })
  return res.data
}

export async function deleteListingReview(id: string) {
  await apiClient.delete(`/api/v1/listing-reviews/${id}/`)
}

export async function fetchMerchantReviews(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<MerchantReview>>('/api/v1/merchant-reviews/', { params })
  return res.data
}

export async function deleteMerchantReview(id: string) {
  await apiClient.delete(`/api/v1/merchant-reviews/${id}/`)
}

export async function fetchMerchantScores(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<MerchantScore>>('/api/v1/merchant-scores/', { params })
  return res.data
}

// Notifications
export async function fetchNotifications(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<Notification>>('/api/v1/notifications/', { params })
  return res.data
}

export async function markNotificationRead(id: string) {
  await apiClient.post(`/api/v1/notifications/${id}/mark_as_read/`)
}

export async function markAllNotificationsRead() {
  await apiClient.post('/api/v1/notifications/mark_all_as_read/')
}

export async function fetchPushTokens() {
  const res = await apiClient.get<PaginatedResponse<PushToken>>('/api/v1/push-tokens/')
  // Normalize: backend returns standard paginated response
  return { tokens: res.data.results ?? [], count: res.data.count ?? 0 }
}

// Notifications unread count — dedicated endpoint
export async function fetchUnreadCount() {
  const res = await apiClient.get<{ count: number }>('/api/v1/notifications/unread_count/')
  return res.data.count ?? 0
}
