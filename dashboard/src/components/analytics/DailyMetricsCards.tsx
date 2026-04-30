import { DailyAnalyticsSnapshot } from '@/types'
import { KPICard } from '@/components/shared/KPICard'
import {
  MdPeople,
  MdStorefront,
  MdListAlt,
  MdShoppingBag,
} from 'react-icons/md'

interface DailyMetricsCardsProps {
  data: DailyAnalyticsSnapshot[]
  isLoading: boolean
}

export function DailyMetricsCards({ data, isLoading }: DailyMetricsCardsProps) {
  if (!data || data.length === 0) {
    return <div className="text-muted-foreground text-sm">No analytics data available</div>
  }

  const today = data[0]
  const yesterday = data[1]

  const calculateTrend = (todayValue: number, yesterdayValue?: number) => {
    if (!yesterdayValue) return 0
    return todayValue - yesterdayValue
  }

  const formatTrend = (trend: number) => {
    if (trend > 0) return `+${trend}`
    if (trend < 0) return `${trend}`
    return '0'
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600'
    if (trend < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  const usersTrend = calculateTrend(today.total_users, yesterday?.total_users)
  const merchantsTrend = calculateTrend(today.total_merchants, yesterday?.total_merchants)
  const listingsTrend = calculateTrend(today.total_listings, yesterday?.total_listings)
  const ordersTrend = calculateTrend(today.total_orders, yesterday?.total_orders)

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today's Users</p>
          <MdPeople className="h-4 w-4 text-purple-500" />
        </div>
        <p className="text-2xl font-bold">{today.total_users}</p>
        <p className={`text-xs font-medium mt-1 ${getTrendColor(usersTrend)}`}>
          {formatTrend(usersTrend)} from yesterday
        </p>
        <p className="text-xs text-muted-foreground mt-2">Weekly: {today.total_users}</p>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today's Merchants</p>
          <MdStorefront className="h-4 w-4 text-green-500" />
        </div>
        <p className="text-2xl font-bold">{today.total_merchants}</p>
        <p className={`text-xs font-medium mt-1 ${getTrendColor(merchantsTrend)}`}>
          {formatTrend(merchantsTrend)} from yesterday
        </p>
        <p className="text-xs text-muted-foreground mt-2">Weekly: {today.total_merchants}</p>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today's Listings</p>
          <MdListAlt className="h-4 w-4 text-amber-500" />
        </div>
        <p className="text-2xl font-bold">{today.total_listings}</p>
        <p className={`text-xs font-medium mt-1 ${getTrendColor(listingsTrend)}`}>
          {formatTrend(listingsTrend)} from yesterday
        </p>
        <p className="text-xs text-muted-foreground mt-2">Weekly: {today.total_listings}</p>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today's Orders</p>
          <MdShoppingBag className="h-4 w-4 text-blue-500" />
        </div>
        <p className="text-2xl font-bold">{today.total_orders}</p>
        <p className={`text-xs font-medium mt-1 ${getTrendColor(ordersTrend)}`}>
          {formatTrend(ordersTrend)} from yesterday
        </p>
        <p className="text-xs text-muted-foreground mt-2">Weekly: {today.total_orders}</p>
      </div>
    </div>
  )
}
