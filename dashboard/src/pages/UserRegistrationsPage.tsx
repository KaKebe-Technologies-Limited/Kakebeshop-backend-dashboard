import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Users, Mail, Phone, Download } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { formatDateTime } from '@/lib/utils'

interface AdminUser {
  id: string
  name: string
  email: string
  username: string
  phone: string | null
  profile_image: string | null
  is_active: boolean
  is_staff: boolean
  is_verified: boolean
  auth_provider: string
  created_at: string
  updated_at: string
}

interface UsersResponse {
  count: number
  total_pages: number
  current_page: number
  next: string | null
  previous: string | null
  results: AdminUser[]
}

export default function UserRegistrationsPage() {
  const [sp, setSp] = useSearchParams()
  const qc = useQueryClient()
  const { toast } = useToast()

  const page = parseInt(sp.get('page') ?? '1', 10)
  const q = sp.get('q') ?? ''
  const isStaff = sp.get('is_staff') ?? ''
  const isActive = sp.get('is_active') ?? ''

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'make-staff' | 'revoke-staff'; user: AdminUser } | null>(null)

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, q, isStaff, isActive],
    queryFn: async () => {
      const params: Record<string, unknown> = { page }
      if (q) params.q = q
      if (isStaff) params.is_staff = isStaff
      if (isActive) params.is_active = isActive
      const res = await apiClient.get<UsersResponse>('/api/v1/admin/users/', { params })
      return res.data
    },
    placeholderData: prev => prev,
    staleTime: 30_000,
  })

  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  const actionMutation = useMutation({
    mutationFn: async ({ type, userId }: { type: string; userId: string }) => {
      if (type === 'deactivate') return apiClient.delete(`/api/v1/admin/users/${userId}/`)
      if (type === 'make-staff') return apiClient.post(`/api/v1/admin/users/${userId}/make-staff/`)
      if (type === 'revoke-staff') return apiClient.post(`/api/v1/admin/users/${userId}/revoke-staff/`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
      setConfirmAction(null)
      setSelectedUser(null)
    },
  })

  // Export all user emails as CSV
  const exportEmails = async () => {
    try {
      // Fetch all pages
      const allUsers: AdminUser[] = []
      let p = 1
      while (true) {
        const res = await apiClient.get<UsersResponse>('/api/v1/admin/users/', {
          params: { page: p, page_size: 100, ...(isActive ? { is_active: isActive } : {}) }
        })
        allUsers.push(...res.data.results)
        if (!res.data.next) break
        p++
      }
      const csv = ['Name,Email,Phone,Username,Verified,Joined']
        .concat(allUsers.map(u =>
          `"${u.name ?? ''}","${u.email}","${u.phone ?? ''}","${u.username}","${u.is_verified}","${u.created_at.split('T')[0]}"`
        ))
        .join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kakebe-users-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: `Exported ${allUsers.length} users` })
    } catch {
      toast({ variant: 'destructive', title: 'Export failed' })
    }
  }

  const actionLabels = {
    'deactivate': 'Deactivate this user account?',
    'make-staff': 'Grant staff access to this user?',
    'revoke-staff': 'Revoke staff access from this user?',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> User Management
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Manage all platform users</p>
        </div>
        <div className="flex items-center gap-2">
          {data && <Badge variant="secondary">{data.count} total</Badge>}
          <Button variant="outline" size="sm" onClick={() => void exportEmails()}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={v => set('q', v)} placeholder="Search by name, email, username…" className="w-64" />
        <Select value={isStaff} onChange={e => set('is_staff', e.target.value)} className="w-36">
          <option value="">All users</option>
          <option value="true">Staff only</option>
          <option value="false">Non-staff</option>
        </Select>
        <Select value={isActive} onChange={e => set('is_active', e.target.value)} className="w-36">
          <option value="">Any status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
        {(q || isStaff || isActive) && (
          <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={8} cols={8} />
          ) : (
            <TableBody>
              {!(data?.results?.length) ? (
                <TableEmpty colSpan={8} />
              ) : (
                data.results.map(u => (
                  <TableRow key={u.id} className="cursor-pointer" onClick={() => setSelectedUser(u)}>
                    <TableCell className="font-medium">{u.name || '—'}</TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${u.email}`}
                        onClick={e => e.stopPropagation()}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" /> {u.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      {u.phone
                        ? <a href={`tel:${u.phone}`} onClick={e => e.stopPropagation()} className="text-sm text-primary hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {u.phone}
                          </a>
                        : <span className="text-sm text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{u.is_staff ? <Badge variant="default">Staff</Badge> : <Badge variant="muted">No</Badge>}</TableCell>
                    <TableCell>{u.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</TableCell>
                    <TableCell>{u.is_verified ? <Badge variant="success">Yes</Badge> : <Badge variant="muted">No</Badge>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(u.created_at)}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedUser(u)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          )}
        </Table>
        {data && <Pagination page={page} totalPages={totalPages} count={data.count} onPage={p => set('page', String(p))} />}
      </Card>

      {/* Confirm Action Dialog */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)} title="Confirm Action" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm">
            <span className="font-semibold">{confirmAction?.user.email}</span>
            {' — '}
            {confirmAction ? actionLabels[confirmAction.type] : ''}
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant={confirmAction?.type === 'deactivate' ? 'destructive' : 'default'}
              onClick={() => confirmAction && actionMutation.mutate({ type: confirmAction.type, userId: confirmAction.user.id })}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending ? 'Processing…' : 'Confirm'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedUser && !confirmAction} onClose={() => setSelectedUser(null)} title="User Details" size="md">
        {selectedUser && (
          <div className="p-6 space-y-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              {selectedUser.profile_image
                ? <img src={selectedUser.profile_image} alt="" className="h-14 w-14 rounded-full object-cover border border-border" />
                : <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {(selectedUser.name || selectedUser.username || '?')[0].toUpperCase()}
                  </div>}
              <div>
                <p className="font-semibold text-base">{selectedUser.name || selectedUser.username}</p>
                <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                <div className="flex gap-1 mt-1">
                  {selectedUser.is_staff && <Badge variant="default">Staff</Badge>}
                  {selectedUser.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                  {selectedUser.is_verified && <Badge variant="success">Verified</Badge>}
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
              <a href={`mailto:${selectedUser.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Mail className="h-4 w-4" /> {selectedUser.email}
              </a>
              {selectedUser.phone
                ? <a href={`tel:${selectedUser.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Phone className="h-4 w-4" /> {selectedUser.phone}
                  </a>
                : <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /> No phone number</p>}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Auth Provider', value: selectedUser.auth_provider },
                { label: 'Joined', value: formatDateTime(selectedUser.created_at) },
                { label: 'Last Updated', value: formatDateTime(selectedUser.updated_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <p className="mt-0.5 font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {selectedUser.is_staff ? (
                <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'revoke-staff', user: selectedUser })}>
                  Revoke Staff Access
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'make-staff', user: selectedUser })}>
                  Grant Staff Access
                </Button>
              )}
              {selectedUser.is_active && (
                <Button size="sm" variant="destructive" onClick={() => setConfirmAction({ type: 'deactivate', user: selectedUser })}>
                  Deactivate Account
                </Button>
              )}
              <a href={`mailto:${selectedUser.email}`} className="inline-flex items-center gap-1 text-sm border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors">
                <Mail className="h-4 w-4" /> Send Email
              </a>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
