import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'support' | 'viewer'

// Permission definitions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [
    'view_dashboard', 'manage_orders', 'manage_merchants', 'manage_listings',
    'manage_categories', 'manage_tags', 'view_analytics', 'view_reports',
    'manage_transactions', 'manage_banners', 'view_audit_logs', 'manage_conversations',
    'manage_registrations', 'view_visitor_analytics', 'manage_roles', 'manage_settings',
    'manage_staff', 'manage_payouts', 'manage_coupons', 'manage_reviews',
    'delete_records', 'export_data', 'system_configuration'
  ],
  admin: [
    'view_dashboard', 'manage_orders', 'manage_merchants', 'manage_listings',
    'manage_categories', 'manage_tags', 'view_analytics', 'view_reports',
    'manage_transactions', 'manage_banners', 'view_audit_logs', 'manage_conversations',
    'manage_registrations', 'view_visitor_analytics', 'manage_staff', 'manage_payouts',
    'manage_coupons', 'manage_reviews', 'export_data'
  ],
  moderator: [
    'view_dashboard', 'manage_orders', 'manage_merchants', 'manage_listings',
    'view_analytics', 'view_reports', 'manage_conversations', 'manage_reviews'
  ],
  support: [
    'view_dashboard', 'view_reports', 'manage_conversations'
  ],
  viewer: [
    'view_dashboard', 'view_analytics', 'view_reports'
  ]
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 5,
  admin: 4,
  moderator: 3,
  support: 2,
  viewer: 1
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canManageRole(managingRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[managingRole] > ROLE_HIERARCHY[targetRole]
}

interface AuthState {
  access: string | null
  refresh: string | null
  userId: string | null
  name: string | null
  username: string | null
  role: UserRole
  permissions: string[]
  isAuthenticated: boolean
  hasHydrated: boolean
  login: (tokens: { access: string; refresh: string }, user: { userId: string; name: string; username: string; role?: UserRole; permissions?: string[] }) => void
  logout: () => Promise<void>
  setAccess: (access: string) => void
  setHasHydrated: () => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      access: null,
      refresh: null,
      userId: null,
      name: null,
      username: null,
      role: 'viewer',
      permissions: [],
      isAuthenticated: false,
      hasHydrated: false,

      login: (tokens, user) => {
        const role = user.role ?? 'viewer'
        const permissions = user.permissions ?? ROLE_PERMISSIONS[role]
        set({
          access: tokens.access,
          refresh: tokens.refresh,
          userId: user.userId,
          name: user.name,
          username: user.username,
          role,
          permissions,
          isAuthenticated: true,
        })
      },

      logout: async () => {
        set({
          access: null,
          refresh: null,
          userId: null,
          name: null,
          username: null,
          role: 'viewer',
          permissions: [],
          isAuthenticated: false,
        })
      },

      setAccess: (access) => set({ access }),
      setHasHydrated: () => set({ hasHydrated: true }),
      hasPermission: (permission: string) => {
        const state = get()
        return state.permissions.includes(permission)
      },
    }),
    {
      name: 'kakebe_auth',
      partialize: (state) => ({
        access: state.access,
        refresh: state.refresh,
        userId: state.userId,
        name: state.name,
        username: state.username,
        role: state.role,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated()
      },
    },
  ),
)
