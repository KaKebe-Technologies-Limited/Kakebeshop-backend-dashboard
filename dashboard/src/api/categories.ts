import apiClient from './client'
import type { Category, PaginatedResponse } from '@/types'

export interface CategoryFilters {
  page?: number
  search?: string
  is_featured?: boolean
  is_active?: boolean
  parent?: string | null
  ordering?: string
}

export async function fetchCategories(filters: CategoryFilters = {}) {
  const params: Record<string, unknown> = { ...filters }
  if (params.parent === null) params.parent = 'null'
  const res = await apiClient.get<PaginatedResponse<Category>>('/api/v1/categories/', { params })
  return res.data
}

export async function fetchCategoryTree() {
  const res = await apiClient.get<Category[]>('/api/v1/categories/tree/')
  return res.data
}

export async function fetchCategoryById(id: string) {
  const res = await apiClient.get<Category>(`/api/v1/categories/${id}/`)
  return res.data
}

export async function fetchAllCategories(): Promise<Category[]> {
  // Fetch first page to get count, then fetch all pages in parallel
  const first = await fetchCategories({ page: 1 })
  const totalPages = first.total_pages ?? Math.ceil(first.count / 20)
  if (totalPages <= 1) return first.results

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => fetchCategories({ page: i + 2 }))
  )
  return [first.results, ...remaining.map(r => r.results)].flat()
}

export interface CreateCategoryPayload {
  name: string
  slug?: string
  icon?: string
  description?: string | null
  parent?: string | null
  allows_order_intent?: boolean
  allows_cart?: boolean
  is_contact_only?: boolean
  is_featured?: boolean
  sort_order?: number
  is_active?: boolean
}

export async function createCategory(payload: CreateCategoryPayload) {
  const res = await apiClient.post<Category>('/api/v1/categories/', payload)
  return res.data
}

export async function updateCategory(id: string, payload: Partial<CreateCategoryPayload>) {
  const res = await apiClient.patch<Category>(`/api/v1/categories/${id}/`, payload)
  return res.data
}

export async function deleteCategory(id: string) {
  const res = await apiClient.delete(`/api/v1/categories/${id}/`)
  // Log status to help diagnose soft-delete vs hard-delete behaviour.
  // 204 = hard delete (row removed). 200 with body = likely soft-delete (is_active set to false).
  console.info(
    `[deleteCategory] id=${id} status=${res.status}`,
    res.data ?? '(no body)',
  )
  return res
}
