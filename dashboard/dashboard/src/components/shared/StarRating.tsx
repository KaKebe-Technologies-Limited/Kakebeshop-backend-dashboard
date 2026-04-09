import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StarRating({ rating, total }: { rating: number; total?: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className={cn('h-3.5 w-3.5', rating > 0 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      {total !== undefined && <span className="text-xs text-muted-foreground">({total})</span>}
    </div>
  )
}
