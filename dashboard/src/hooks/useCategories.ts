import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategories, createCategory, updateCategory, deleteCategory, type CategoryFilters } from '@/api/categories'
import { queryKeys } from '@/lib/queryKeys'

export function useCategories(filters: CategoryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.categories.list(filters as Record<string, unknown>),
    queryFn: () => fetchCategories(filters),
    placeholderData: prev => prev,
    staleTime: 60_000,
  })
}

export function useCategoryMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCategory>[1] }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })

  const remove = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })

  return {
    createCategory: create.mutateAsync,
    updateCategory: update.mutateAsync,
    deleteCategory: remove.mutateAsync,
  }
}
