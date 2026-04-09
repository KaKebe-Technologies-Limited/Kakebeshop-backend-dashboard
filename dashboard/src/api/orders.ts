import apiClient from './client'
import type { Order, OrderGroup, PaginatedResponse } from '@/types'

export interface OrderFilters {
  page?: number
  search?: string
  status?: string
  ordering?: string
}

export async function fetchOrders(filters: OrderFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const res = await apiClient.get<PaginatedResponse<Order>>('/api/v1/orders/', { params })
  return res.data
}

export async function fetchOrderById(id: string) {
  const res = await apiClient.get<Order>(`/api/v1/orders/${id}/`)
  return res.data
}

export async function fetchOrderGroups(filters: OrderFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const res = await apiClient.get<PaginatedResponse<OrderGroup>>('/api/v1/order-groups/', { params })
  return res.data
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await apiClient.patch<Order>(`/api/v1/orders/${id}/update-status/`, { status })
  return res.data
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
