import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { ntfyService } from '@/services/ntfyService'
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
  const page = parseInt(sp.get('page') ?? '1', 10)
  const search = sp.get('search') ?? ''
  const status = sp.get('status') ?? ''

  const [selectedId, setSelectedId] = useState<string | null>(null)

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading, refetch } = useRegistrations(page, search, status)
  const totalPages = data?.count ? Math.ceil(data.count / 20) : 0

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(`/admin/registrations/${id}/approve`)
      const approved = data?.results.find(r => r.id === id)
      if (approved) {
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

  const selectedReg = data?.results.find(r => r.id === selectedId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Registrations</h1>
          <p className="text-muted-foreground">Manage new user registration requests</p>
        </div>
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

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <TableBody>
              {!data?.results.length ? (
                <TableEmpty colSpan={6} />
              ) : (
                data.results.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedId(r.id)}>
                    <TableCell className="font-medium">{r.username}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email}</TableCell>
                    <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDateTime(r.created_at)}</TableCell>
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
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Username</p>
                <p className="font-medium">{selectedReg.username}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Email</p>
                <p className="font-medium">{selectedReg.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Phone</p>
                <p className="font-medium">{selectedReg.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Status</p>
                <Badge variant={selectedReg.status === 'approved' ? 'success' : selectedReg.status === 'rejected' ? 'destructive' : 'secondary'}>
                  {selectedReg.status}
                </Badge>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground uppercase">Registered</p>
                <p className="font-medium">{formatDateTime(selectedReg.created_at)}</p>
              </div>
            </div>
            {selectedReg.status === 'pending' && (
              <div className="flex gap-2 pt-4">
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