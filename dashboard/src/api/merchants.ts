import apiClient from './client'
import type { MerchantDetail, MerchantListItem, PaginatedResponse } from '@/types'

export interface MerchantFilters {
  page?: number
  q?: string
  verified?: boolean | ''
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | ''
  ordering?: string
}

export async function fetchMerchants(filters: MerchantFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const res = await apiClient.get<PaginatedResponse<MerchantListItem>>('/api/v1/admin/merchants/', { params })
  return res.data
}

export async function fetchMerchantById(id: string) {
  const res = await apiClient.get<MerchantDetail>(`/api/v1/admin/merchants/${id}/`)
  return res.data
}

export async function updateMerchant(id: string, payload: Partial<MerchantDetail>) {
  const res = await apiClient.patch<MerchantDetail>(`/api/v1/admin/merchants/${id}/`, payload)
  return res.data
}

export async function deleteMerchant(id: string) {
  const res = await apiClient.delete(`/api/v1/admin/merchants/${id}/`)
  return res.data
}

export async function verifyMerchant(id: string) {
  const res = await apiClient.post(`/api/v1/admin/merchants/${id}/verify/`)
  return res.data
}

export async function suspendMerchant(id: string) {
  const res = await apiClient.post(`/api/v1/admin/merchants/${id}/suspend/`)
  return res.data
}

export async function banMerchant(id: string) {
  const res = await apiClient.post(`/api/v1/admin/merchants/${id}/ban/`)
  return res.data
}
