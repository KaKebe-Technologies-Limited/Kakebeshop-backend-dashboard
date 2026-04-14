import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Users, CheckSquare, Square, CheckCheck, XCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { bulkApproveRegistrations, bulkRejectRegistrations } from '@/api/bulkOperations'
import { ntfyService } from '@/services/ntfyService'
import { notificationService } from '@/services/notificationService'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface UserRegistration {
  id: string
  username: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at: string | null
  approved_by: string | null
}

interface RegistrationsResponse {
  count: number
  next: string | null
  previous: string | null
  results: UserRegistration[]
}

function useRegistrations(page: number, search: string, status: string) {
  return useQuery({
    queryKey: ['registrations', page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const res = await apiClient.get(`/admin/registrations?${params}`)
      return res.data as RegistrationsResponse
    },
  })
}

export default function UserRegistrationsPage() {
  const [sp, setSp] = useSearchParams()
  const queryClient = useQueryClient()
  const hasPermission = useAuthStore(s => s.hasPermission)
  
  const page = parseInt(sp.get('page') ?? '1', 10)
  const search = sp.get('search') ?? ''
  const status = sp.get('status') ?? ''

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null)

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading, refetch } = useRegistrations(page, search, status)
  const totalPages = data?.count ? Math.ceil(data.count / 20) : 0

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => bulkApproveRegistrations(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      setSelectedIds(new Set())
      setBulkAction(null)
      // Send notifications for approved users
      result.count && console.log(`Approved ${result.count} registrations`)
    },
  })

  const bulkRejectMutation = useMutation({
    mutationFn: (ids: string[]) => bulkRejectRegistrations(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      setSelectedIds(new Set())
      setBulkAction(null)
    },
  })

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(`/admin/registrations/${id}/approve`)
      const approved = data?.results?.find(r => r.id === id)
      if (approved) {
        // Send multi-channel notification
        void notificationService.notifyRegistrationApproved({
          email: approved.email,
          username: approved.username,
        })
        
        // Also send ntfy notification for admin tracking
        void ntfyService.notifyUserRegistered(
          approved.email || approved.username,
          'admin approval',
          navigator.userAgent,
        )
      }
      refetch()
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await apiClient.post(`/admin/registrations/${id}/reject`)
      refetch()
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (!(data?.results?.length)) return
    
    const pendingIds = (data?.results ?? [])
      .filter(r => r.status === 'pending')
      .map(r => r.id)
    
    if (selectedIds.size === pendingIds.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingIds))
    }
  }

  const handleBulkAction = async () => {
    if (selectedIds.size === 0 || !bulkAction) return

    if (bulkAction === 'approve') {
      await bulkApproveMutation.mutateAsync(Array.from(selectedIds))
    } else if (bulkAction === 'reject') {
      await bulkRejectMutation.mutateAsync(Array.from(selectedIds))
    }
  }

  const selectedReg = data?.results?.find(r => r.id === selectedId)
  const pendingCount = data?.results?.filter(r => r.status === 'pending').length ?? 0
  const canBulkAction = hasPermission('manage_registrations') && selectedIds.size > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Registrations
          </h1>
          <p className="text-muted-foreground mt-0.5">Manage new user registration requests</p>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {data.count} total
            </Badge>
            {pendingCount > 0 && (
              <Badge variant="warning" className="text-sm">
                {pendingCount} pending
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={v => set('search', v)} placeholder="Search by username or email…" className="w-64" />
        <Select value={status} onChange={e => set('status', e.target.value)} className="w-40">
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        {(search || status) && (
          <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear filters</Button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {canBulkAction && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{selectedIds.size} registration{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                onClick={() => setBulkAction('approve')}
                disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Approve Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkAction('reject')}
                disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Bulk Action Confirmation Dialog */}
      <Dialog
        open={!!bulkAction}
        onClose={() => setBulkAction(null)}
        title={`Bulk ${bulkAction === 'approve' ? 'Approve' : 'Reject'} Registrations`}
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm">
            Are you sure you want to {bulkAction} <strong>{selectedIds.size}</strong> registration{selectedIds.size > 1 ? 's' : ''}?
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleBulkAction}
              disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
            >
              {bulkAction === 'approve' ? 'Approve' : 'Reject'} {selectedIds.size} Registrations
            </Button>
            <Button
              variant="outline"
              onClick={() => setBulkAction(null)}
              disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {canBulkAction && status !== 'approved' && status !== 'rejected' && (
                  <button onClick={toggleSelectAll} className="hover:opacity-70">
                    {data && selectedIds.size === (data.results ?? []).filter(r => r.status === 'pending').length && selectedIds.size > 0
                      ? <CheckSquare className="h-4 w-4" />
                      : <Square className="h-4 w-4" />
                    }
                  </button>
                )}
              </TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <TableBody>
              {!(data?.results?.length) ? (
                <TableEmpty colSpan={7} message="No registrations found. Try adjusting your filters." />
              ) : (
                (data.results ?? []).map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <TableCell>
                      {canBulkAction && r.status === 'pending' && (
                        <button onClick={() => toggleSelect(r.id)} className="hover:opacity-70">
                          {selectedIds.has(r.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => setSelectedId(r.id)}>{r.username}</TableCell>
                    <TableCell className="text-muted-foreground text-sm" onClick={() => setSelectedId(r.id)}>{r.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.phone}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedId(r.id) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          )}
        </Table>
        {data && (
          <Pagination page={page} totalPages={totalPages} count={data.count} onPage={p => set('page', String(p))} />
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedId} onClose={() => setSelectedId(null)} title="Registration Details" size="md">
        {selectedReg && (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                {selectedReg.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{selectedReg.username}</h2>
                <p className="text-sm text-muted-foreground">{selectedReg.email}</p>
              </div>
              <Badge variant={selectedReg.status === 'approved' ? 'success' : selectedReg.status === 'rejected' ? 'destructive' : 'secondary'} className="text-sm">
                {selectedReg.status}
              </Badge>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Email', value: selectedReg.email },
                { label: 'Phone', value: selectedReg.phone },
                { label: 'Status', value: selectedReg.status },
                { label: 'Registered', value: formatDateTime(selectedReg.created_at) },
                { label: 'Approved At', value: selectedReg.approved_at ? formatDateTime(selectedReg.approved_at) : '—' },
                { label: 'Approved By', value: selectedReg.approved_by ?? '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <p className="mt-0.5 text-foreground font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            {selectedReg.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => handleApprove(selectedReg.id)}>Approve</Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleReject(selectedReg.id)}>Reject</Button>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  )
}