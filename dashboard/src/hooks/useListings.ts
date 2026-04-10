import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchListings, updateListing, deleteListing, type ListingFilters, type UpdateListingPayload } from '@/api/listings'
import { queryKeys } from '@/lib/queryKeys'

export function useListings(filters: ListingFilters = {}) {
  return useQuery({
    queryKey: queryKeys.listings.list(filters as Record<string, unknown>),
    queryFn: () => fetchListings(filters),
    placeholderData: prev => prev,
    staleTime: 30_000,
  })
}

export function useListingMutations() {
  const qc = useQueryClient()

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListingPayload }) => updateListing(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.listings.all })
    },
  })

  const remove = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.listings.all })
    },
  })

  return {
    updateListing: update.mutateAsync,
    deleteListing: remove.mutateAsync,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
  }
}
