import type { OrderHealth } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MdCheckCircle, MdCancel } from 'react-icons/md'

interface OrderHealthProps {
  data: OrderHealth | null
  period: 'daily' | 'weekly'
  isLoading: boolean
}

export function OrderHealthCard({ data, isLoading }: OrderHealthProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return <p className="text-muted-foreground text-sm">No order health data</p>
  }

  const total = data.completed_orders + data.cancelled_orders
  const completionRate = total === 0 ? 0 : Math.round((data.completed_orders / total) * 100)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="bg-green-500/5 border-green-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MdCheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-sm">Completed</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">{data.completed_orders}</p>
          <p className="text-xs text-muted-foreground mt-1">{completionRate}% completion rate</p>
        </CardContent>
      </Card>

      <Card className="bg-red-500/5 border-red-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MdCancel className="h-5 w-5 text-red-600" />
            <CardTitle className="text-sm">Cancelled</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-600">{data.cancelled_orders}</p>
          <p className="text-xs text-muted-foreground mt-1">{100 - completionRate}% cancellation rate</p>
        </CardContent>
      </Card>
    </div>
  )
}
