import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// ─── Request interceptor — attach JWT ────────────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const raw = localStorage.getItem('kakebe_auth')
  if (raw) {
    try {
      // Zustand persist wraps state as { state: { access, ... }, version }
      const parsed = JSON.parse(raw) as { state?: { access?: string } }
      const access = parsed.state?.access
      if (access) {
        config.headers.Authorization = `Bearer ${access}`
      }
    } catch {
      // malformed storage — ignore
    }
  }
  return config
})

// ─── Response interceptor — 401 → logout ─────────────────────────────────────
apiClient.interceptors.response.use(
  res => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kakebe_auth')
      // redirect to login without full page reload if possible
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
      }
    }
    return Promise.reject(err)
  },
)

export default apiClient
