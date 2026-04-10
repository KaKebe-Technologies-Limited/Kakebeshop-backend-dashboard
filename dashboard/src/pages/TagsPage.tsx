import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/useTags'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const responseData = (error as { response?: { data?: unknown } }).response?.data
    if (typeof responseData === 'string') return responseData
    if (typeof responseData === 'object' && responseData !== null) {
      const first = Object.values(responseData as Record<string, unknown>)[0]
      if (Array.isArray(first) && first.length > 0) return String(first[0])
    }
  }
  return 'Request failed. Check backend validation and permissions.'
}

export default function TagsPage() {
  const { data, isLoading } = useTags()
  const createTag = useCreateTag()
  const deleteTag = useDeleteTag()
  const { toast } = useToast()
  const [newName, setNewName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function handleCreate() {
    if (!newName.trim()) return
    createTag.mutate(newName.trim(), {
      onSuccess: () => {
        setNewName('')
        toast({ title: 'Tag created', description: 'Tag was created successfully.' })
      },
      onError: (e) => {
        toast({ variant: 'destructive', title: 'Create failed', description: getErrorMessage(e) })
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Add tag */}
      <div className="flex gap-2 items-center">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New tag name…"
          className="w-64"
          maxLength={100}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
        />
        <Button onClick={handleCreate} loading={createTag.isPending} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" /> Add Tag
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 w-24 rounded shimmer" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.results.length ? (
              <TableEmpty colSpan={4} message="No tags yet." />
            ) : (
              data.results.map(tag => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{tag.slug}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatDate(tag.created_at)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(tag.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Confirm delete */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Tag" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">This will permanently delete the tag. Are you sure?</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              loading={deleteTag.isPending}
              onClick={() => deleteTag.mutate(confirmDelete!, {
                onSuccess: () => {
                  setConfirmDelete(null)
                  toast({ title: 'Tag deleted', description: 'Tag was removed successfully.' })
                },
                onError: (e) => {
                  toast({ variant: 'destructive', title: 'Delete failed', description: getErrorMessage(e) })
                },
              })}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
