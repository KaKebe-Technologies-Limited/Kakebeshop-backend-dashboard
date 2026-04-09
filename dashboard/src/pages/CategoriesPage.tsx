import { useState } from 'react'
import { useCategoryTree, useCategoryMutations } from '@/hooks/useCategories'
import { ChevronRight, ChevronDown, FolderOpen, Folder, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
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

export default function CategoriesPage() {
  const { data: tree, isLoading, refetch } = useCategoryTree()
  const { createCategory } = useCategoryMutations()
  const [selected, setSelected] = useState<CategoryTreeNode | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    setIsSubmitting(true)
    try {
      await createCategory({ name: newCategoryName.trim() })
      setNewCategoryName('')
      setShowCreateDialog(false)
      refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* Tree */}
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
            (tree as unknown as CategoryTreeNode[] ?? []).map(node => (
              <TreeNode key={node.id} node={node} selectedId={selected?.id ?? null} onSelect={setSelected} />
            ))
          )}
        </div>
      </Card>

      {/* Detail */}
      <Card>
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-2 text-muted-foreground">
            <FolderOpen className="h-10 w-10 opacity-30" />
            <p className="text-sm">Select a category to view details</p>
          </div>
        ) : (
          <div>
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>{selected.name}</CardTitle>
                <ActiveBadge active={selected.is_active} />
                {selected.is_featured && <Badge variant="warning">Featured</Badge>}
              </div>
              {selected.parent_name && (
                <p className="text-xs text-muted-foreground mt-0.5">Under: {selected.parent_name}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Behaviour flags */}
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

              {/* Meta */}
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

      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
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
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateCategory} disabled={isSubmitting || !newCategoryName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
