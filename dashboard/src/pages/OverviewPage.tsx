import { useQueries, useQuery } from '@tanstack/react-query'
import { fetchListings } from '@/api/listings'
import { fetchMerchants } from '@/api/merchants'
import { fetchCategories } from '@/api/categories'
import { fetchTags } from '@/api/tags'
import { fetchOrders } from '@/api/orders'
import apiClient from '@/api/client'
import { KPICard } from '@/components/shared/KPICard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MerchantAvatar } from '@/components/shared/MerchantAvatar'
import { StarRating } from '@/components/shared/StarRating'
import { OrderStatusBadge, ListingTypeBadge } from '@/components/shared/StatusBadge'
import { formatDate, formatUGX } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { MdStorefront, MdListAlt, MdCategory, MdLocalOffer,
  MdShoppingBag, MdCheckCircle,
  MdPeople, MdNewReleases, MdCancel, MdPendingActions, MdTrendingUp } from 'react-icons/md'
import { RiLiveLine } from 'react-icons/ri'

interface AdminStats {
  total_users: number; active_users: number; staff_users: number
  total_merchants: number; verified_merchants: number; pending_merchants: number
  total_listings: number; active_listings: number; pending_listings: number
  total_orders: number; new_orders: number; completed_orders: number; cancelled_orders: number
  total_categories: number; total_images: number
}

export default function OverviewPage() {
  const navigate = useNavigate()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/admin/stats/')
      const raw = res.data as any
      return (raw.data ?? raw) as AdminStats
    },
    staleTime: 60_000,
  })

  const results = useQueries({
    queries: [
      { queryKey: ['overview', 'merchants-all'], queryFn: () => fetchMerchants({ page: 1, ordering: '-created_at' }), staleTime: 60_000 },
      { queryKey: ['overview', 'listings-all'], queryFn: () => fetchListings({ page: 1, ordering: '-created_at' }), staleTime: 60_000 },
      { queryKey: ['overview', 'orders-new'], queryFn: () => fetchOrders({ status: 'NEW', ordering: '-created_at' }), staleTime: 30_000 },
      { queryKey: ['overview', 'categories'], queryFn: () => fetchCategories({ page: 1 }), staleTime: 60_000 },
      { queryKey: ['overview', 'tags'], queryFn: () => fetchTags(), staleTime: 60_000 },
    ],
  })

  const [merchantsAll, listingsAll, newOrders, categories, tags] = results
  const isLoading = statsLoading || results.some(r => r.isLoading)

  const topMerchants = (merchantsAll.data?.results ?? [])
    .slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5)

  const recentListings = listingsAll.data?.results.slice(0, 5) ?? []
  const pendingOrders = newOrders.data?.results.slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      {/* Primary KPIs from admin stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Orders" value={stats?.total_orders ?? '—'} icon={MdShoppingBag} color="amber" loading={isLoading}
          onClick={() => navigate('/orders')} />
        <KPICard label="New Orders" value={stats?.new_orders ?? '—'} icon={RiLiveLine} color="blue" loading={isLoading}
          onClick={() => navigate('/live-orders')} />
        <KPICard label="Total Merchants" value={stats?.total_merchants ?? '—'} icon={MdStorefront} color="green" loading={isLoading}
          onClick={() => navigate('/merchants')} />
        <KPICard label="Total Users" value={stats?.total_users ?? '—'} icon={MdPeople} color="purple" loading={isLoading}
          onClick={() => navigate('/user-registrations')} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Listings" value={stats?.total_listings ?? '—'} icon={MdListAlt} color="amber" loading={isLoading}
          onClick={() => navigate('/listings')} />
        <KPICard label="Pending Listings" value={stats?.pending_listings ?? '—'} icon={MdPendingActions} color="blue" loading={isLoading}
          onClick={() => navigate('/listings?status=PENDING')} />
        <KPICard label="Verified Merchants" value={stats?.verified_merchants ?? '—'} icon={MdCheckCircle} color="green" loading={isLoading}
          onClick={() => navigate('/merchants?verified=true')} />
        <KPICard label="Cancelled Orders" value={stats?.cancelled_orders ?? '—'} icon={MdCancel} color="slate" loading={isLoading}
          onClick={() => navigate('/orders?status=CANCELLED')} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Categories" value={stats?.total_categories ?? categories.data?.count ?? '—'} icon={MdCategory} color="purple" loading={isLoading}
          onClick={() => navigate('/categories')} />
        <KPICard label="Tags" value={tags.data?.count ?? '—'} icon={MdLocalOffer} color="slate" loading={isLoading}
          onClick={() => navigate('/tags')} />
        <KPICard label="Completed Orders" value={stats?.completed_orders ?? '—'} icon={MdCheckCircle} color="green" loading={isLoading}
          onClick={() => navigate('/orders?status=COMPLETED')} />
        <KPICard label="Pending Merchants" value={stats?.pending_merchants ?? '—'} icon={MdNewReleases} color="amber" loading={isLoading}
          onClick={() => navigate('/merchants?verified=false')} />
      </div>

      {/* New Orders Alert */}
      {(stats?.new_orders ?? 0) > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors"
          onClick={() => navigate('/live-orders')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                <RiLiveLine className="h-5 w-5 text-amber-500 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-amber-500">
                  {stats?.new_orders} New Order{(stats?.new_orders ?? 0) > 1 ? 's' : ''} Waiting
                </p>
                <p className="text-xs text-amber-500/70">Click to view Live Orders</p>
              </div>
            </div>
            <MdTrendingUp className="h-5 w-5 text-amber-500" />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pending Orders */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">New Orders</CardTitle>
            <button onClick={() => navigate('/live-orders')} className="text-xs text-primary hover:underline">View all</button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-28 rounded shimmer" />
                        <div className="h-3 w-20 rounded shimmer" />
                      </div>
                    </div>
                  ))
                : pendingOrders.length === 0
                  ? <p className="text-xs text-muted-foreground text-center py-6">No new orders</p>
                  : pendingOrders.map(o => (
                      <div key={o.id} className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate('/live-orders')}>
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-semibold truncate">{o.order_number}</p>
                          <p className="text-xs text-muted-foreground truncate">{o.buyer_name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold">{formatUGX(o.total_amount)}</p>
                          <OrderStatusBadge status={o.status} />
                        </div>
                      </div>
                    ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Merchants */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Top Merchants</CardTitle>
            <button onClick={() => navigate('/merchants')} className="text-xs text-primary hover:underline">View all</button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-8 w-8 rounded-full shimmer" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-28 rounded shimmer" />
                        <div className="h-3 w-16 rounded shimmer" />
                      </div>
                    </div>
                  ))
                : topMerchants.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate('/merchants')}>
                      <MerchantAvatar logo={m.logo} name={m.display_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{m.display_name}</p>
                        {m.business_name && <p className="text-[11px] text-muted-foreground truncate">{m.business_name}</p>}
                      </div>
                      <StarRating rating={m.rating} total={m.total_reviews} />
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Listings */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Recent Listings</CardTitle>
            <button onClick={() => navigate('/listings')} className="text-xs text-primary hover:underline">View all</button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-8 w-8 rounded shimmer" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-32 rounded shimmer" />
                        <div className="h-3 w-20 rounded shimmer" />
                      </div>
                    </div>
                  ))
                : recentListings.map(l => (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate('/listings')}>
                      {l.primary_image
                        ? <img src={l.primary_image.image} alt={l.title} className="h-8 w-8 rounded object-cover flex-shrink-0" />
                        : <div className="h-8 w-8 rounded bg-muted flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{l.title}</p>
                        <p className="text-[11px] text-muted-foreground">{l.merchant_name} · {formatDate(l.created_at)}</p>
                      </div>
                      <ListingTypeBadge type={l.listing_type} />
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
