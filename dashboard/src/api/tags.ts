import apiClient from './client'
import type { Tag, PaginatedResponse } from '@/types'

export async function fetchTags(params: Record<string, unknown> = {}) {
  const res = await apiClient.get<PaginatedResponse<Tag>>('/api/v1/tags/', { params })
  return res.data
}

export async function createTag(name: string) {
  const res = await apiClient.post<Tag>('/api/v1/tags/', { name })
  return res.data
}

export async function deleteTag(id: string) {
  await apiClient.delete(`/api/v1/tags/${id}/`)
}
