import apiClient from './client'
import type { Conversation, Message, PaginatedResponse } from '@/types'

export async function fetchConversations(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<Conversation>>('/api/v1/conversations/', { params })
  return res.data
}

export async function fetchConversationById(id: string) {
  const res = await apiClient.get<Conversation>(`/api/v1/conversations/${id}/`)
  return res.data
}

export async function fetchMessages(conversationId: string, params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<Message>>(
    `/api/v1/conversations/${conversationId}/messages/`,
    { params },
  )
  return res.data
}

export async function sendMessage(conversationId: string, message: string) {
  const res = await apiClient.post<Message>(
    `/api/v1/conversations/${conversationId}/messages/`,
    { message },
  )
  return res.data
}
