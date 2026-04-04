import { useQuery } from '@tanstack/react-query'
import { fetchListings, type ListingFilters } from '@/api/listings'
import { queryKeys } from '@/lib/queryKeys'

export function useListings(filters: ListingFilters = {}) {
  return useQuery({
    queryKey: queryKeys.listings.list(filters as Record<string, unknown>),
    queryFn: () => fetchListings(filters),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}
