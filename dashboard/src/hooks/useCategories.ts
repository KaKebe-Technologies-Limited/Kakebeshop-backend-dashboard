import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategories, createCategory, updateCategory, deleteCategory, toggleCategoryActive, type CategoryFilters } from '@/api/categories'
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
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })

  const create = useMutation({ mutationFn: createCategory, onSuccess: invalidate })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCategory>[1] }) => updateCategory(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: deleteCategory, onSuccess: invalidate })

  const toggle = useMutation({ mutationFn: toggleCategoryActive, onSuccess: invalidate })

  return {
    createCategory: create.mutateAsync,
    updateCategory: update.mutateAsync,
    deleteCategory: remove.mutateAsync,
    toggleCategoryActive: toggle.mutateAsync,
    isToggling: toggle.isPending,
  }
}
