import apiClient from './client'
import type { CartItem, Wishlist, WishlistItem, PaginatedResponse } from '@/types'

export async function fetchCartItems(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<CartItem>>('/api/v1/cart/items/', { params })
  return res.data
}

export async function fetchWishlists(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<Wishlist>>('/api/v1/wishlist/', { params })
  return res.data
}

export async function fetchWishlistItems(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<WishlistItem>>('/api/v1/wishlist/items/', { params })
  return res.data
}
