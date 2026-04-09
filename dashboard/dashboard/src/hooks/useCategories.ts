import { useQuery } from '@tanstack/react-query'
import { fetchCategories, fetchCategoryTree, type CategoryFilters } from '@/api/categories'
import { queryKeys } from '@/lib/queryKeys'

export function useCategories(filters: CategoryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.categories.list(filters as Record<string, unknown>),
    queryFn: () => fetchCategories(filters),
    placeholderData: prev => prev,
    staleTime: 60_000,
  })
}

export function useCategoryTree() {
  return useQuery({
    queryKey: queryKeys.categories.tree,
    queryFn: fetchCategoryTree,
    staleTime: 10 * 60_000,
  })
}
