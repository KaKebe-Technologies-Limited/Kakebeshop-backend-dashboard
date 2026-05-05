import apiClient from './client'
import type { UserProfile } from '@/types'

interface LoginPayload { email: string; password: string }
interface LoginResponse {
  name: string
  username: string
  user_id: string
  role?: string
  tokens: { access: string; refresh: string }
}

export async function login(payload: LoginPayload) {
  const res = await apiClient.post<LoginResponse>('/auth/login/', payload)
  // Backend returns tokens as a JSON string — parse it
  const tokens = typeof res.data.tokens === 'string'
    ? JSON.parse(res.data.tokens) as { access: string; refresh: string }
    : res.data.tokens as unknown as { access: string; refresh: string }
  return {
    tokens,
    user: {
      userId: res.data.user_id,
      name: res.data.name,
      username: res.data.username,
      role: res.data.role,
    },
  }
}

export async function logout(refresh: string) {
  await apiClient.post('/auth/logout/', { refresh })
}

export async function refreshToken(refresh: string) {
  const res = await apiClient.post<{ access: string }>('/auth/token/refresh/', { refresh })
  return res.data.access
}

export async function getProfile() {
  const res = await apiClient.get<UserProfile>('/auth/profile/')
  return res.data
}
