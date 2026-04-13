import { useAuthStore, type UserRole } from '@/stores/authStore'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requiredPermission?: string
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, requiredPermission, fallback }: RoleGuardProps) {
  const role = useAuthStore(s => s.role)
  const hasPermission = useAuthStore(s => s.hasPermission)

  // Check role-based access if allowedRoles is provided
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      fallback ?? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-foreground">Access Denied</p>
            <p className="text-sm text-muted-foreground mt-0.5">You don't have permission to view this page.</p>
          </div>
        </div>
      )
    )
  }

  // Check permission-based access if requiredPermission is provided
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      fallback ?? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-foreground">Access Denied</p>
            <p className="text-sm text-muted-foreground mt-0.5">You don't have the required permission: {requiredPermission}</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
