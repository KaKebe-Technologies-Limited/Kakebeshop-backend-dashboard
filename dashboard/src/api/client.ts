import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const BASE_URL = 'https://backend.kakebeshop.com/'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// ─── Request interceptor — attach JWT ────────────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { access } = useAuthStore.getState()
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

// ─── Response interceptor — 401 → refresh → retry ────────────────────────────
let isRefreshing = false
type FailedRequest = {
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}
let failedQueue: FailedRequest[] = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (err.response?.status === 401 && !originalRequest._retry) {
      const { refresh, logout } = useAuthStore.getState()

      if (!refresh) {
        logout()
        redirectToLogin()
        return Promise.reject(err)
      }

      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((error) => Promise.reject(error))
      }

      isRefreshing = true

      try {
        const res = await axios.post<{ access: string }>(`${BASE_URL}/auth/token/refresh/`, { refresh })
        const newAccess = res.data.access
        useAuthStore.getState().setAccess(newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        return apiClient(originalRequest)
      } catch (refreshErr) {
        processQueue(err as AxiosError, null)
        logout()
        redirectToLogin()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  },
)

function redirectToLogin() {
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
  }
}

export default apiClient
