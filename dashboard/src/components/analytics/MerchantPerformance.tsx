import { MerchantPerformance } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatUGX } from '@/lib/utils'

interface MerchantPerformanceProps {
  data: MerchantPerformance | null
  period: 'daily' | 'weekly'
  isLoading: boolean
}

export function MerchantPerformanceCard({ data, period, isLoading }: MerchantPerformanceProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(j => (
                  <div key={j} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return <p className="text-muted-foreground text-sm">No merchant performance data</p>
  }

  const title = period === 'daily' ? "Today's Top Merchants" : "This Week's Top Merchants"

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title} (by Orders)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.by_order_count.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data</p>
            ) : (
              data.by_order_count.map((m, i) => (
                <div key={m.merchant_id} className="flex items-center justify-between pb-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">#{i + 1}</p>
                    <p className="text-sm font-medium">{m.merchant_name}</p>
                  </div>
                  <p className="text-sm font-semibold">{m.order_count} orders</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title} (by Revenue)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.by_order_value.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data</p>
            ) : (
              data.by_order_value.map((m, i) => (
                <div key={m.merchant_id} className="flex items-center justify-between pb-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">#{i + 1}</p>
                    <p className="text-sm font-medium">{m.merchant_name}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatUGX(m.total_revenue)}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
