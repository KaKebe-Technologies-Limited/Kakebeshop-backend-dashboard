import apiClient from './client'
import type { UserProfile } from '@/types'

interface LoginPayload { email: string; password: string }
interface LoginResponse {
  name: string
  username: string
  user_id: string
  tokens: { access: string; refresh: string }
}

export async function login(payload: LoginPayload) {
  const res = await apiClient.post<LoginResponse>('/auth/login/', payload)
  return { tokens: res.data.tokens, user: { userId: res.data.user_id, name: res.data.name, username: res.data.username } }
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
