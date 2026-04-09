import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTags, createTag, deleteTag } from '@/api/tags'
import { queryKeys } from '@/lib/queryKeys'

export function useTags(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.tags.list(params),
    queryFn: () => fetchTags(params),
    staleTime: 60_000,
  })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.tags.all }),
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.tags.all }),
  })
}
