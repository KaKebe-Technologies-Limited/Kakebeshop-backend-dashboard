import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Users } from 'lucide-react'
import apiClient from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { SearchInput } from '@/components/shared/SearchInput'
import { Dialog } from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/utils'

interface AdminUser {
  id: string
  name: string
  email: string
  username: string
  is_active: boolean
  is_staff: boolean
  is_verified: boolean
  created_at: string
}

interface UsersResponse {
  count: number
  results: AdminUser[]
}

export default function RoleManagementPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ type: 'make-staff' | 'revoke-staff'; user: AdminUser } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['staff-users', search],
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      if (search) params.q = search
      const res = await apiClient.get<UsersResponse>('/api/v1/admin/users/', { params })
      return res.data
    },
    staleTime: 30_000,
  })

  const actionMutation = useMutation({
    mutationFn: ({ type, userId }: { type: string; userId: string }) =>
      apiClient.post(`/api/v1/admin/users/${userId}/${type}/`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff-users'] })
      setConfirmAction(null)
    },
  })

  const staffUsers = data?.results.filter(u => u.is_staff) ?? []
  const nonStaffUsers = data?.results.filter(u => !u.is_staff) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> Staff Management
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Grant or revoke staff access to users</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="default">{staffUsers.length} staff</Badge>
          <Badge variant="secondary">{data?.count ?? 0} total users</Badge>
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search users…" className="max-w-sm" />

      {/* Staff Users */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Staff Members
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : (
            <TableBody>
              {!staffUsers.length ? (
                <TableEmpty colSpan={6} message="No staff members found." />
              ) : (
                staffUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || u.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.username}</TableCell>
                    <TableCell>{u.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(u.created_at)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="destructive" onClick={() => setConfirmAction({ type: 'revoke-staff', user: u })}>
                        Revoke Staff
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          )}
        </Table>
      </Card>

      {/* Non-staff Users */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle>All Users — Grant Staff Access</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : (
            <TableBody>
              {!nonStaffUsers.length ? (
                <TableEmpty colSpan={6} message="No non-staff users found." />
              ) : (
                nonStaffUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || u.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.username}</TableCell>
                    <TableCell>{u.is_verified ? <Badge variant="success">Yes</Badge> : <Badge variant="muted">No</Badge>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(u.created_at)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'make-staff', user: u })}>
                        Make Staff
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          )}
        </Table>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)} title="Confirm Action" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm">
            {confirmAction?.type === 'make-staff'
              ? <>Grant staff access to <span className="font-semibold">{confirmAction.user.email}</span>?</>
              : <>Revoke staff access from <span className="font-semibold">{confirmAction?.user.email}</span>?</>}
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant={confirmAction?.type === 'revoke-staff' ? 'destructive' : 'default'}
              onClick={() => confirmAction && actionMutation.mutate({ type: confirmAction.type, userId: confirmAction.user.id })}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending ? 'Processing…' : 'Confirm'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Permissions reference */}
      <Card>
        <CardHeader><CardTitle>What Staff Access Means</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Staff users (<code>is_staff=True</code>) have access to this admin dashboard and all admin API endpoints.</p>
          <p>Non-staff users are regular platform users — merchants, buyers, etc.</p>
          <p>To grant access to this dashboard, make the user staff using the button above.</p>
        </CardContent>
      </Card>
    </div>
  )
}
