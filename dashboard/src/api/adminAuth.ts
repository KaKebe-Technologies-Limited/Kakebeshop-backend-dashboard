import apiClient from './client'

interface AdminUser {
  id: string
  name: string
  username: string
  email: string
  role: string
}

interface AdminLoginResponse {
  user: AdminUser
  tokens: {
    access: string
    refresh: string
  }
}

export async function adminLogin(credentials: { email: string; password: string }): Promise<AdminLoginResponse> {
  const response = await apiClient.post('/admin/auth/login', credentials)
  return response.data
}

export async function adminLogout(): Promise<void> {
  const response = await apiClient.post('/admin/auth/logout')
  return response.data
}

export async function refreshAdminToken(refreshToken: string): Promise<{ access: string }> {
  const response = await apiClient.post('/admin/auth/refresh', { refresh: refreshToken })
  return response.data
}