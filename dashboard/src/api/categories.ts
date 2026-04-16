import apiClient from './client'
import type { Category, PaginatedResponse } from '@/types'

export interface CategoryFilters {
  page?: number
  q?: string
  is_featured?: boolean
  is_active?: boolean
  parent_only?: boolean
  ordering?: string
}

export async function fetchCategories(filters: CategoryFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined)
  )
  const res = await apiClient.get<PaginatedResponse<Category>>('/api/v1/admin/categories/', { params })
  // If there are more pages, fetch them all
  const first = res.data
  if (!first.total_pages || first.total_pages <= 1) return first
  const rest = await Promise.all(
    Array.from({ length: first.total_pages - 1 }, (_, i) =>
      apiClient.get<PaginatedResponse<Category>>('/api/v1/admin/categories/', { params: { ...params, page: i + 2 } })
    )
  )
  return {
    ...first,
    results: [first.results, ...rest.map(r => r.data.results)].flat(),
  }
}

export async function fetchCategoryById(id: string) {
  const res = await apiClient.get<Category>(`/api/v1/admin/categories/${id}/`)
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
  const res = await apiClient.post<Category>('/api/v1/admin/categories/', payload)
  return res.data
}

export async function updateCategory(id: string, payload: Partial<CreateCategoryPayload>) {
  const res = await apiClient.patch<Category>(`/api/v1/admin/categories/${id}/`, payload)
  return res.data
}

export async function deleteCategory(id: string) {
  const res = await apiClient.delete(`/api/v1/admin/categories/${id}/`)
  return res
}

export async function toggleCategoryActive(id: string) {
  const res = await apiClient.post(`/api/v1/admin/categories/${id}/toggle-active/`)
  return res.data
}
