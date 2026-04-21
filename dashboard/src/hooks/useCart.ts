import { useQuery } from '@tanstack/react-query'
import { fetchCartItems, fetchWishlists, fetchWishlistItems } from '@/api/cart'
import { queryKeys } from '@/lib/queryKeys'

export function useCartItems(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.cartItems.list(params),
    queryFn: () => fetchCartItems(params),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}

export function useWishlists(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.wishlists.list(params),
    queryFn: () => fetchWishlists(params),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}

export function useWishlistItems(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.wishlistItems.list(params),
    queryFn: () => fetchWishlistItems(params),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}
