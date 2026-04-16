import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchListings, updateListing, deleteListing,
  approveListing, rejectListing, featureListing,
  type ListingFilters, type UpdateListingPayload,
} from '@/api/listings'
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
  const invalidate = () => void qc.invalidateQueries({ queryKey: queryKeys.listings.all })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListingPayload }) => updateListing(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: deleteListing,
    onSuccess: invalidate,
  })

  const approve = useMutation({
    mutationFn: approveListing,
    onSuccess: invalidate,
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectListing(id, reason),
    onSuccess: invalidate,
  })

  const feature = useMutation({
    mutationFn: featureListing,
    onSuccess: invalidate,
  })

  return {
    updateListing: update.mutateAsync,
    deleteListing: remove.mutateAsync,
    approveListing: approve.mutateAsync,
    rejectListing: reject.mutateAsync,
    featureListing: feature.mutateAsync,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
    isApproving: approve.isPending,
    isRejecting: reject.isPending,
    isFeaturing: feature.isPending,
  }
}
