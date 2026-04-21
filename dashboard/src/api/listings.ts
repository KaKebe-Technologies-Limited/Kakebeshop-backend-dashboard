import apiClient from './client'
import type { Listing, PaginatedResponse } from '@/types'

export interface ListingFilters {
  page?: number
  q?: string
  listing_type?: 'PRODUCT' | 'SERVICE' | ''
  status?: string
  merchant_id?: string
  category_id?: string
  is_verified?: boolean | ''
  ordering?: string
}

export async function fetchListings(filters: ListingFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const res = await apiClient.get<PaginatedResponse<Listing>>('/api/v1/admin/listings/', { params })
  return res.data
}

export async function fetchListingById(id: string) {
  const res = await apiClient.get<Listing>(`/api/v1/admin/listings/${id}/`)
  return res.data
}

export interface UpdateListingPayload {
  title?: string
  description?: string
  category?: string
  price_type?: string
  price?: string | null
  price_min?: string | null
  price_max?: string | null
  currency?: string
  status?: string
  is_verified?: boolean
  is_featured?: boolean
  featured_until?: string | null
}

export async function updateListing(id: string, payload: UpdateListingPayload) {
  const res = await apiClient.patch<Listing>(`/api/v1/admin/listings/${id}/`, payload)
  return res.data
}

export async function deleteListing(id: string) {
  await apiClient.delete(`/api/v1/admin/listings/${id}/`)
}

export async function approveListing(id: string) {
  const res = await apiClient.post(`/api/v1/admin/listings/${id}/approve/`)
  return res.data
}

export async function rejectListing(id: string, reason?: string) {
  const res = await apiClient.post(`/api/v1/admin/listings/${id}/reject/`, { reason })
  return res.data
}

export async function featureListing(id: string) {
  const res = await apiClient.post(`/api/v1/admin/listings/${id}/feature/`)
  return res.data
}

export interface CreateListingPayload {
  merchant: string
  title: string
  description?: string
  listing_type: 'PRODUCT' | 'SERVICE'
  category: string
  price_type: 'FIXED' | 'RANGE'
  price?: string | null
  price_min?: string | null
  price_max?: string | null
  currency?: string
  is_price_negotiable?: boolean
  status?: string
}

export async function createListing(payload: CreateListingPayload) {
  const res = await apiClient.post<Listing>('/api/v1/admin/listings/', payload)
  return res.data
}
