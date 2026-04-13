import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Users, Edit, Plus } from 'lucide-react'
import apiClient from '@/api/client'
import { useAuthStore, ROLE_PERMISSIONS, canManageRole, type UserRole } from '@/stores/authStore'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { SearchInput } from '@/components/shared/SearchInput'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface AdminUser {
  id: string
  username: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
  last_login: string | null
  created_at: string
}

interface AdminUsersResponse {
  count: number
  results: AdminUser[]
}

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  support: 'Support',
  viewer: 'Viewer'
}

const ROLE_COLORS: Record<UserRole, 'destructive' | 'default' | 'secondary' | 'success' | 'warning'> = {
  super_admin: 'destructive',
  admin: 'default',
  moderator: 'success',
  support: 'secondary',
  viewer: 'warning'
}

export default function RoleManagementPage() {
  const queryClient = useQueryClient()
  const currentUserRole = useAuthStore(s => s.role)
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await apiClient.get(`/admin/users?${params}`)
      return res.data as AdminUsersResponse
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      await apiClient.patch(`/admin/users/${userId}/role`, { role })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setIsEditDialogOpen(false)
    },
  })

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; password: string; role: UserRole; name: string }) => {
      await apiClient.post('/admin/users', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setIsCreateDialogOpen(false)
    },
  })

  const selectedUser = data?.results.find(u => u.id === selectedUserId)

  return (
    <RoleGuard requiredPermission="manage_roles">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Role & Staff Management
            </h1>
            <p className="text-muted-foreground mt-0.5">Manage admin users and their permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {data?.count ?? 0} total users
            </Badge>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Search */}
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or username..." className="w-96" />

        {/* Users Table */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={8} cols={6} />
            ) : (
              <TableBody>
                {!data?.results.length ? (
                  <TableEmpty colSpan={6} message="No users found." />
                ) : (
                  data.results.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_COLORS[user.role]}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'success' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        {canManageRole(currentUserRole, user.role) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUserId(user.id)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </Card>

        {/* Role Permissions Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
                <div key={role} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    <h3 className="font-semibold">{ROLE_LABELS[role as UserRole]}</h3>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {permissions.length} permissions
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {permissions.slice(0, 3).map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {p.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} title="Edit User Role" size="md">
          {selectedUser && (
            <EditUserRoleForm
              user={selectedUser}
              currentRole={currentUserRole}
              onUpdate={async (role) => {
                await updateRoleMutation.mutateAsync({ userId: selectedUser.id, role })
              }}
              isSubmitting={updateRoleMutation.isPending}
              onClose={() => setIsEditDialogOpen(false)}
            />
          )}
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} title="Create Admin User" size="md">
          <CreateUserForm
            onCreate={async (data) => {
              await createUserMutation.mutateAsync(data)
            }}
            isSubmitting={createUserMutation.isPending}
            onClose={() => setIsCreateDialogOpen(false)}
          />
        </Dialog>
      </div>
    </RoleGuard>
  )
}

function EditUserRoleForm({
  user,
  currentRole,
  onUpdate,
  isSubmitting,
  onClose
}: {
  user: AdminUser
  currentRole: UserRole
  onUpdate: (role: UserRole) => Promise<void>
  isSubmitting: boolean
  onClose: () => void
}) {
  const [role, setRole] = useState<UserRole>(user.role)

  const availableRoles = Object.keys(ROLE_PERMISSIONS).filter(r =>
    canManageRole(currentRole, r as UserRole)
  ) as UserRole[]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onUpdate(role)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="space-y-2">
        <Label>User</Label>
        <div className="p-3 bg-muted rounded-lg">
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          {availableRoles.map(r => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          Update Role
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function CreateUserForm({
  onCreate,
  isSubmitting,
  onClose
}: {
  onCreate: (data: { username: string; email: string; password: string; role: UserRole; name: string }) => Promise<void>
  isSubmitting: boolean
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'viewer' as UserRole
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onCreate(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          Create User
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
