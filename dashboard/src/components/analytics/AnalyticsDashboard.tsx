import {
  useDailyAnalytics,
  useMerchantPerformance,
  useOrderHealth,
  useUserEngagement,
} from '@/hooks/useAnalytics'
import { DailyMetricsCards } from './DailyMetricsCards'
import { TrendCharts } from './TrendCharts'
import { MerchantPerformanceCard } from './MerchantPerformance'
import { OrderHealthCard } from './OrderHealth'
import { UserEngagementCard } from './UserEngagement'

export function AnalyticsDashboard() {
  const dailyAnalytics = useDailyAnalytics(7)
  const merchantPerfDaily = useMerchantPerformance('daily')
  const merchantPerfWeekly = useMerchantPerformance('weekly')
  const orderHealthDaily = useOrderHealth('daily')
  const orderHealthWeekly = useOrderHealth('weekly')
  const userEngDaily = useUserEngagement('daily')
  const userEngWeekly = useUserEngagement('weekly')

  return (
    <div className="space-y-6">
      {/* Error states */}
      {(dailyAnalytics.error ||
        merchantPerfDaily.error ||
        orderHealthDaily.error ||
        userEngDaily.error) && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-600">
          Failed to load some analytics. Please try refreshing the page.
        </div>
      )}

      {/* Daily Metrics Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Daily Metrics</h2>
        <DailyMetricsCards
          data={dailyAnalytics.data ?? []}
          isLoading={dailyAnalytics.isLoading}
        />
      </div>

      {/* Trend Charts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">7-Day Trends</h2>
        <TrendCharts
          data={dailyAnalytics.data ?? []}
          isLoading={dailyAnalytics.isLoading}
        />
      </div>

      {/* Merchant Performance */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Merchant Performance</h2>
        <MerchantPerformanceCard
          data={merchantPerfDaily.data ?? null}
          period="daily"
          isLoading={merchantPerfDaily.isLoading}
        />
        <div className="mt-4">
          <MerchantPerformanceCard
            data={merchantPerfWeekly.data ?? null}
            period="weekly"
            isLoading={merchantPerfWeekly.isLoading}
          />
        </div>
      </div>

      {/* Order Health */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Order Health</h2>
        <OrderHealthCard
          data={orderHealthDaily.data ?? null}
          period="daily"
          isLoading={orderHealthDaily.isLoading}
        />
        <div className="mt-4">
          <OrderHealthCard
            data={orderHealthWeekly.data ?? null}
            period="weekly"
            isLoading={orderHealthWeekly.isLoading}
          />
        </div>
      </div>

      {/* User Engagement */}
      <div>
        <h2 className="text-lg font-semibold mb-4">User Engagement</h2>
        <UserEngagementCard
          data={userEngDaily.data ?? null}
          period="daily"
          isLoading={userEngDaily.isLoading}
        />
        <div className="mt-4">
          <UserEngagementCard
            data={userEngWeekly.data ?? null}
            period="weekly"
            isLoading={userEngWeekly.isLoading}
          />
        </div>
      </div>
    </div>
  )
}
