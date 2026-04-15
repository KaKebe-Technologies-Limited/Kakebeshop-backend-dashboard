import apiClient from './client'

// User Registration bulk operations
export async function bulkApproveRegistrations(ids: string[]): Promise<{ count: number }> {
  const response = await apiClient.post('/admin/registrations/bulk-approve', { ids })
  return response.data
}

export async function bulkRejectRegistrations(ids: string[], reason?: string): Promise<{ count: number }> {
  const response = await apiClient.post('/admin/registrations/bulk-reject', { ids, reason })
  return response.data
}

// Order bulk operations
export async function bulkUpdateOrderStatus(ids: string[], status: string): Promise<{ count: number }> {
  const response = await apiClient.post('/api/v1/orders/bulk-update-status/', { ids, status })
  return response.data
}

export async function bulkExportOrders(filters: Record<string, any>): Promise<Blob> {
  const response = await apiClient.post('/api/v1/orders/export/', filters, {
    responseType: 'blob'
  })
  return response.data
}
