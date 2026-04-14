interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requiredPermission?: string
  fallback?: React.ReactNode
}

export function RoleGuard({ children }: RoleGuardProps) {
  // TODO: Re-enable role/permission checks when the permissions system is ready
  // Temporarily bypass: all authenticated users can access everything
  return <>{children}</>
}
