import apiClient from './client'
import type { Order, OrderGroup, PaginatedResponse } from '@/types'

export interface OrderFilters {
  page?: number
  q?: string
  status?: string
  merchant_id?: string
  buyer_id?: string
  date_from?: string
  date_to?: string
  ordering?: string
}

// The backend returns a custom response wrapper: { success, count, data }
// We normalize it to the PaginatedResponse format the frontend expects.
interface BackendOrderListResponse {
  success: boolean
  count: number
  total_pages?: number
  current_page?: number
  next?: string | null
  previous?: string | null
  data: Order[]
}

interface BackendSingleResponse<T> {
  success: boolean
  data: T
}

function normalizeOrderList(raw: BackendOrderListResponse): PaginatedResponse<Order> {
  const pageSize = 20
  return {
    count: raw.count,
    total_pages: raw.total_pages ?? (Math.ceil(raw.count / pageSize) || 1),
    current_page: raw.current_page,
    next: raw.next ?? null,
    previous: raw.previous ?? null,
    results: (raw as any).results ?? raw.data ?? [],
  }
}

export async function fetchOrders(filters: OrderFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const res = await apiClient.get<BackendOrderListResponse>('/api/v1/admin/orders/', { params })
  return normalizeOrderList(res.data)
}

export async function fetchOrderById(id: string) {
  const res = await apiClient.get<BackendSingleResponse<Order> | Order>(`/api/v1/admin/orders/${id}/`)
  // Handle both wrapped { success, data } and unwrapped responses
  const raw = res.data as any
  return raw.data ?? raw
}

export async function fetchOrderGroups(filters: OrderFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const res = await apiClient.get<any>('/api/v1/order-groups/', { params })
  const raw = res.data
  // Normalize: backend may use { success, count, data } or standard pagination
  return {
    count: raw.count ?? 0,
    total_pages: raw.total_pages ?? (Math.ceil((raw.count ?? 0) / 20) || 1),
    next: raw.next ?? null,
    previous: raw.previous ?? null,
    results: raw.results ?? raw.data ?? [],
  } as PaginatedResponse<OrderGroup>
}

export async function updateOrderStatus(id: string, status: string, notes?: string) {
  const res = await apiClient.post<BackendSingleResponse<Order> | Order>(`/api/v1/admin/orders/${id}/update-status/`, { status, ...(notes && { notes }) })
  const raw = res.data as any
  return raw.data ?? raw
}

interface CreateOrderPayload {
  buyer: string
  merchant: string
  notes?: string
  delivery_fee?: string
  expected_delivery_date?: string
  items: Array<{
    listing: string
    quantity: number
    unit_price: string
  }>
}

export async function createOrder(payload: CreateOrderPayload) {
  const res = await apiClient.post('/api/v1/orders/', payload)
  return res.data
}
