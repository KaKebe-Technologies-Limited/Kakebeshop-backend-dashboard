import { useQueries } from '@tanstack/react-query'
import { Store, ListChecks, FolderTree, Tag, ShoppingBag, CheckCircle, Star, TrendingUp } from 'lucide-react'
import { fetchListings } from '@/api/listings'
import { fetchMerchants } from '@/api/merchants'
import { fetchCategories } from '@/api/categories'
import { fetchTags } from '@/api/tags'
import { KPICard } from '@/components/shared/KPICard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MerchantAvatar } from '@/components/shared/MerchantAvatar'
import { StarRating } from '@/components/shared/StarRating'
import { ListingTypeBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'

export default function OverviewPage() {
  const results = useQueries({
    queries: [
      { queryKey: ['overview', 'listings-all'], queryFn: () => fetchListings({ page: 1 }), staleTime: 60_000 },
      { queryKey: ['overview', 'listings-products'], queryFn: () => fetchListings({ listing_type: 'PRODUCT' }), staleTime: 60_000 },
      { queryKey: ['overview', 'listings-services'], queryFn: () => fetchListings({ listing_type: 'SERVICE' }), staleTime: 60_000 },
      { queryKey: ['overview', 'merchants-all'], queryFn: () => fetchMerchants({ page: 1 }), staleTime: 60_000 },
      { queryKey: ['overview', 'merchants-verified'], queryFn: () => fetchMerchants({ verified: true }), staleTime: 60_000 },
      { queryKey: ['overview', 'merchants-featured'], queryFn: () => fetchMerchants({ status: 'ACTIVE' }), staleTime: 60_000 },
      { queryKey: ['overview', 'categories'], queryFn: () => fetchCategories({ page: 1 }), staleTime: 60_000 },
      { queryKey: ['overview', 'tags'], queryFn: () => fetchTags(), staleTime: 60_000 },
    ],
  })

  const [listingsAll, listingsProducts, listingsServices, merchantsAll, merchantsVerified, merchantsFeatured, categories, tags] = results
  const isLoading = results.some(r => r.isLoading)

  const topMerchants = (merchantsAll.data?.results ?? [])
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)

  const recentListings = listingsAll.data?.results.slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Listings" value={listingsAll.data?.count ?? '—'} icon={ListChecks} color="amber" loading={isLoading} />
        <KPICard label="Total Merchants" value={merchantsAll.data?.count ?? '—'} icon={Store} color="blue" loading={isLoading} />
        <KPICard label="Categories" value={categories.data?.count ?? '—'} icon={FolderTree} color="purple" loading={isLoading} />
        <KPICard label="Tags" value={tags.data?.count ?? '—'} icon={Tag} color="slate" loading={isLoading} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          label="Products"
          value={listingsProducts.data?.count ?? '—'}
          icon={ShoppingBag}
          color="amber"
          sub="of total listings"
          loading={isLoading}
        />
        <KPICard
          label="Services"
          value={listingsServices.data?.count ?? '—'}
          icon={TrendingUp}
          color="green"
          sub="of total listings"
          loading={isLoading}
        />
        <KPICard
          label="Verified Merchants"
          value={merchantsVerified.data?.count ?? '—'}
          icon={CheckCircle}
          color="green"
          loading={isLoading}
        />
        <KPICard
          label="Featured Merchants"
          value={merchantsFeatured.data?.count ?? '—'}
          icon={Star}
          color="amber"
          loading={isLoading}
        />
      </div>

      {/* Tables row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Merchants */}
        <Card>
          <CardHeader>
            <CardTitle>Top Merchants by Rating</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="h-10 w-10 rounded-full shimmer" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-32 rounded shimmer" />
                        <div className="h-3 w-20 rounded shimmer" />
                      </div>
                    </div>
                  ))
                : topMerchants.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                      <MerchantAvatar logo={m.logo} name={m.display_name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.display_name}</p>
                        {m.business_name && <p className="text-xs text-muted-foreground truncate">{m.business_name}</p>}
                      </div>
                      <StarRating rating={m.rating} total={m.total_reviews} />
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Listings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="h-9 w-9 rounded shimmer" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-40 rounded shimmer" />
                        <div className="h-3 w-24 rounded shimmer" />
                      </div>
                    </div>
                  ))
                : recentListings.map(l => (
                    <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                      {l.primary_image ? (
                        <img src={l.primary_image.image} alt={l.title} className="h-9 w-9 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded bg-muted flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground">{l.merchant_name} · {formatDate(l.created_at)}</p>
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
