import apiClient from './client'
import type { Listing, PaginatedResponse } from '@/types'

export interface ListingFilters {
  page?: number
  search?: string
  listing_type?: 'PRODUCT' | 'SERVICE' | ''
  is_featured?: boolean | ''
  is_verified?: boolean | ''
  category?: string
  ordering?: string
}

export async function fetchListings(filters: ListingFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const res = await apiClient.get<PaginatedResponse<Listing>>('/api/v1/listings/', { params })
  return res.data
}

export async function fetchListingById(id: string) {
  const res = await apiClient.get<Listing>(`/api/v1/listings/${id}/`)
  return res.data
}

export interface UpdateListingPayload {
  title?: string
  category?: string
  is_featured?: boolean
  is_verified?: boolean
  price?: string | null
  price_min?: string | null
  price_max?: string | null
}

export async function updateListing(id: string, payload: UpdateListingPayload) {
  const res = await apiClient.patch<Listing>(`/api/v1/listings/${id}/`, payload)
  return res.data
}

export async function deleteListing(id: string) {
  await apiClient.delete(`/api/v1/listings/${id}/`)
}

export async function fetchFeaturedListings() {
  const res = await apiClient.get<PaginatedResponse<Listing>>('/api/v1/listings/featured/')
  return res.data
}
