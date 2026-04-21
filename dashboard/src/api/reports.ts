import apiClient from './client'
import type { Report, Transaction, Banner, PaginatedResponse, AuditLog, ListingReview, MerchantReview, MerchantScore, Notification, PushToken } from '@/types'

// Content Reports
export async function fetchReports(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<Report>>('/api/v1/reports/', { params })
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
  placement: string
  display_type?: string
  link_type?: string
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
  const res = await apiClient.get<{ success: boolean; tokens: PushToken[]; count: number }>('/api/v1/push-tokens/')
  return res.data
}

// Notifications unread count
export async function fetchUnreadCount() {
  const res = await apiClient.get<{ count: number; results?: unknown[] }>('/api/v1/notifications/')
  return res.data.count ?? 0
}
