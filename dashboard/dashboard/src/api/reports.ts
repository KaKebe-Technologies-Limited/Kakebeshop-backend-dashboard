import apiClient from './client'
import type { Report, Transaction, Banner, PaginatedResponse, AuditLog } from '@/types'

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
export async function fetchBanners(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<Banner>>('/api/v1/banners/', { params })
  return res.data
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

// Notifications unread count
export async function fetchUnreadCount() {
  const res = await apiClient.get<{ count: number; results?: unknown[] }>('/api/v1/notifications/')
  // API returns paginated list — use count field
  return res.data.count ?? 0
}
