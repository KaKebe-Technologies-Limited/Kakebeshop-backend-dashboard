import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { fetchConversations, fetchConversationById, fetchMessages, sendMessage } from '@/api/conversations'
import { queryKeys } from '@/lib/queryKeys'

export function useConversations(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.conversations.list(params),
    queryFn: () => fetchConversations(params),
    placeholderData: prev => prev,
    staleTime: 20_000,
  })
}

export function useConversationDetail(id: string | null) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => fetchConversationById(id!),
    enabled: !!id,
    staleTime: 20_000,
  })
}

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 1 }) =>
      fetchMessages(conversationId!, { page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (last, _, lastPageParam) =>
      last.next ? (lastPageParam as number) + 1 : undefined,
    enabled: !!conversationId,
    staleTime: 10_000,
  })
}

export function useSendMessage(conversationId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (message: string) => sendMessage(conversationId!, message),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['messages', conversationId] })
      void qc.invalidateQueries({ queryKey: queryKeys.conversations.list({}) })
    },
  })
}
