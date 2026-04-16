import { useMemo, useState } from 'react'
import { useCategories, useCategoryMutations } from '@/hooks/useCategories'
import { ChevronRight, ChevronDown, FolderOpen, Folder, Plus, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { CategoryTreeNode } from '@/types'

function TreeNode({ node, depth = 0, selectedId, onSelect }: {
  node: CategoryTreeNode
  depth?: number
  selectedId: string | null
  onSelect: (n: CategoryTreeNode) => void
}) {
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <button
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
          selectedId === node.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => { onSelect(node); if (hasChildren) setOpen(o => !o) }}
      >
        {hasChildren ? (
          open ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
               : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        ) : (
          <span className="w-3.5" />
        )}
        {hasChildren
          ? <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
          : <Folder className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        }
        <span className="flex-1 truncate">{node.name}</span>
        {node.children_count > 0 && (
          <span className="text-xs text-muted-foreground">({node.children_count})</span>
        )}
      </button>
      {open && hasChildren && node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}

function flattenTree(nodes: CategoryTreeNode[], depth = 0): Array<{ id: string; name: string; depth: number }> {
  return nodes.flatMap((node) => {
    const current = [{ id: node.id, name: node.name, depth }]
    return [...current, ...flattenTree(node.children, depth + 1)]
  })
}

/**
 * Recursively filter out soft-deleted (is_active=false) nodes from the tree.
 * The backend may soft-delete by setting is_active=false rather than removing
 * the record, so we strip those nodes before rendering.
 */
function filterActiveNodes(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  return nodes
    .filter(n => n.is_active !== false)
    .map(n => ({ ...n, children: filterActiveNodes(n.children) }))
}

export default function CategoriesPage() {
  const { data: catData, isLoading, refetch } = useCategories({ page: 1 })
  const { createCategory, updateCategory, deleteCategory } = useCategoryMutations()
  const { toast } = useToast()

  const [selected, setSelected] = useState<CategoryTreeNode | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [createType, setCreateType] = useState<'parent' | 'child'>('parent')
  const [createParentId, setCreateParentId] = useState('')

  const [editCategoryName, setEditCategoryName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const rawTreeNodes = useMemo(() => {
    const flat = catData?.results ?? []
    const map = new Map<string, CategoryTreeNode>()
    flat.forEach(c => map.set(c.id, { ...c, children: [] }))
    const roots: CategoryTreeNode[] = []
    map.forEach(node => {
      if (node.parent) map.get(node.parent)?.children.push(node)
      else roots.push(node)
    })
    return roots
  }, [catData])
  const treeNodes = useMemo(() => filterActiveNodes(rawTreeNodes), [rawTreeNodes])
  const flatCategories = useMemo(() => flattenTree(treeNodes), [treeNodes])

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

  const resetCreateForm = () => {
    setNewCategoryName('')
    setCreateType('parent')
    setCreateParentId('')
  }

  const closeCreateDialog = () => {
    setShowCreateDialog(false)
    resetCreateForm()
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    if (createType === 'child' && !createParentId) return

    setIsSubmitting(true)
    try {
      const payload = createType === 'child'
        ? { name: newCategoryName.trim(), parent: createParentId }
        : { name: newCategoryName.trim() }

      await createCategory(payload)
      toast({ title: 'Category created', description: 'Category was created successfully.' })
      closeCreateDialog()
      refetch()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Create failed', description: getErrorMessage(e) })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = () => {
    if (!selected) return
    setEditCategoryName(selected.name)
    setShowEditDialog(true)
  }

  const handleEditCategory = async () => {
    if (!selected || !editCategoryName.trim()) return
    setIsSubmitting(true)
    try {
      await updateCategory({ id: selected.id, data: { name: editCategoryName.trim() } })
      toast({ title: 'Category updated', description: 'Category changes saved successfully.' })
      setShowEditDialog(false)
      refetch()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Update failed', description: getErrorMessage(e) })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!selected) return
    setIsSubmitting(true)
    try {
      await deleteCategory(selected.id)
      toast({ title: 'Category deleted', description: 'Category was deleted successfully.' })
      setShowDeleteDialog(false)
      setSelected(null)
      refetch()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete failed', description: getErrorMessage(e) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border flex flex-row items-center justify-between">
          <CardTitle>Category Tree</CardTitle>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] p-2">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mx-3 my-2 h-4 rounded shimmer" style={{ width: `${50 + (i % 3) * 15}%` }} />
            ))
          ) : (
            treeNodes.map(node => (
              <TreeNode key={node.id} node={node} selectedId={selected?.id ?? null} onSelect={setSelected} />
            ))
          )}
        </div>
      </Card>

      <Card>
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-2 text-muted-foreground">
            <FolderOpen className="h-10 w-10 opacity-30" />
            <p className="text-sm">Select a category to view details</p>
          </div>
        ) : (
          <div>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle>{selected.name}</CardTitle>
                  <ActiveBadge active={selected.is_active} />
                  {selected.is_featured && <Badge variant="warning">Featured</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={openEditDialog}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>

              {selected.parent_name && (
                <p className="text-xs text-muted-foreground mt-0.5">Under: {selected.parent_name}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Commerce Behaviour</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selected.allows_cart ? 'success' : 'muted'}>
                    {selected.allows_cart ? '✓' : '✗'} Cart
                  </Badge>
                  <Badge variant={selected.allows_order_intent ? 'info' : 'muted'}>
                    {selected.allows_order_intent ? '✓' : '✗'} Order Intent
                  </Badge>
                  <Badge variant={selected.is_contact_only ? 'warning' : 'muted'}>
                    {selected.is_contact_only ? '✓' : '✗'} Contact Only
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Slug', value: selected.slug },
                  { label: 'Sort Order', value: String(selected.sort_order) },
                  { label: 'Child Categories', value: String(selected.children_count) },
                  { label: 'Created', value: formatDate(selected.created_at) },
                  { label: 'Updated', value: formatDate(selected.updated_at) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                    <p className="mt-0.5 font-medium">{value}</p>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{selected.description}</p>
                </div>
              )}
            </CardContent>
          </div>
        )}
      </Card>

      <Dialog open={showCreateDialog} onClose={closeCreateDialog}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Create Category</h2>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="e.g., Electronics"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category-type">Category Type</Label>
              <Select
                id="category-type"
                value={createType}
                onChange={e => {
                  const next = e.target.value as 'parent' | 'child'
                  setCreateType(next)
                  if (next === 'parent') setCreateParentId('')
                }}
                className="mt-1"
              >
                <option value="parent">Parent category</option>
                <option value="child">Child category</option>
              </Select>
            </div>

            {createType === 'child' && (
              <div>
                <Label htmlFor="parent-category">Parent Category</Label>
                <Select
                  id="parent-category"
                  value={createParentId}
                  onChange={e => setCreateParentId(e.target.value)}
                  className="mt-1"
                >
                  <option value="">Select parent category</option>
                  {flatCategories.map(categoryOption => (
                    <option key={categoryOption.id} value={categoryOption.id}>
                      {`${'-- '.repeat(categoryOption.depth)}${categoryOption.name}`}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeCreateDialog}>Cancel</Button>
            <Button
              onClick={handleCreateCategory}
              disabled={isSubmitting || !newCategoryName.trim() || (createType === 'child' && !createParentId)}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Edit Category</h2>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={editCategoryName}
                onChange={e => setEditCategoryName(e.target.value)}
                placeholder="e.g., Electronics"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditCategory} disabled={isSubmitting || !editCategoryName.trim()}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Delete Category</h2>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <span className="font-medium text-foreground">{selected?.name}</span>.
          </p>
          {selected && selected.children_count > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              This category has child categories. Backend may block deletion until children are moved or deleted.
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
