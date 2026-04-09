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
