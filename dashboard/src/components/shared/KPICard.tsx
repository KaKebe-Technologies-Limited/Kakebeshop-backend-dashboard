import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color?: 'amber' | 'blue' | 'green' | 'purple' | 'red' | 'slate'
  sub?: string
  loading?: boolean
  onClick?: () => void
}

const colorMap = {
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export function KPICard({ label, value, icon: Icon, color = 'amber', sub, loading, onClick }: KPICardProps) {
  return (
    <Card
      className={cn('transition-all duration-150', onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5')}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</p>
            {loading ? (
              <div className="mt-2 h-8 w-24 rounded shimmer" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{value}</p>
            )}
            {sub && !loading && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn('flex-shrink-0 rounded-xl p-3', colorMap[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
