import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  totalPages: number
  count: number
  pageSize?: number
  onPage: (p: number) => void
}

export function Pagination({ page, totalPages = 1, count = 0, pageSize = 20, onPage }: PaginationProps) {
  const safeCount = count ?? 0
  const from = Math.min((page - 1) * pageSize + 1, safeCount)
  const to = Math.min(page * pageSize, safeCount)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-sm text-muted-foreground">
        {safeCount === 0 ? 'No results' : `${from}–${to} of ${safeCount.toLocaleString()}`}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3 text-sm text-muted-foreground">
          {page} / {totalPages || 1}
        </span>
        <Button variant="outline" size="icon" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
