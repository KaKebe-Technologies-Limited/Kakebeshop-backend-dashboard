import apiClient from './client'
import type { MerchantDetail, MerchantListItem, PaginatedResponse } from '@/types'

export interface MerchantFilters {
  page?: number
  search?: string
  verified?: boolean | ''
  featured?: boolean | ''
  is_active?: boolean | ''
  ordering?: string
}

export async function fetchMerchants(filters: MerchantFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const res = await apiClient.get<PaginatedResponse<MerchantListItem>>('/api/v1/merchants/', { params })
  return res.data
}

export async function fetchMerchantById(id: string) {
  const res = await apiClient.get<MerchantDetail>(`/api/v1/merchants/${id}/`)
  return res.data
}

export async function fetchFeaturedMerchants() {
  const res = await apiClient.get<PaginatedResponse<MerchantListItem>>('/api/v1/merchants/featured/')
  return res.data
}
