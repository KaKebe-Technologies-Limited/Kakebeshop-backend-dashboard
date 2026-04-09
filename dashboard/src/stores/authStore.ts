import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  access: string | null
  refresh: string | null
  userId: string | null
  name: string | null
  username: string | null
  isAuthenticated: boolean
  login: (tokens: { access: string; refresh: string }, user: { userId: string; name: string; username: string }) => void
  adminLogin: (tokens: { access: string; refresh: string }, user: { userId: string; name: string; username: string }) => void
  logout: () => void
  setAccess: (access: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      userId: null,
      name: null,
      username: null,
      isAuthenticated: false,

      login: (tokens, user) =>
        set({
          access: tokens.access,
          refresh: tokens.refresh,
          userId: user.userId,
          name: user.name,
          username: user.username,
          isAuthenticated: true,
        }),

      adminLogin: (tokens, user) =>
        set({
          access: tokens.access,
          refresh: tokens.refresh,
          userId: user.userId,
          name: user.name,
          username: user.username,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          access: null,
          refresh: null,
          userId: null,
          name: null,
          username: null,
          isAuthenticated: false,
        }),

      setAccess: (access) => set({ access }),
    }),
    {
      name: 'kakebe_auth',
      partialize: (state) => ({
        access: state.access,
        refresh: state.refresh,
        userId: state.userId,
        name: state.name,
        username: state.username,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
