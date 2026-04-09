import { useQueries } from '@tanstack/react-query'
import { fetchListings } from '@/api/listings'
import { fetchMerchants } from '@/api/merchants'
import { KPICard } from '@/components/shared/KPICard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TrendingUp, Store, ListChecks, CheckCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const PIE_COLORS = ['#f59e0b', '#6366f1']

export default function AnalyticsPage() {
  const results = useQueries({
    queries: [
      { queryKey: ['analytics', 'products'], queryFn: () => fetchListings({ listing_type: 'PRODUCT' }), staleTime: 120_000 },
      { queryKey: ['analytics', 'services'], queryFn: () => fetchListings({ listing_type: 'SERVICE' }), staleTime: 120_000 },
      { queryKey: ['analytics', 'merchants-verified'], queryFn: () => fetchMerchants({ verified: true }), staleTime: 120_000 },
      { queryKey: ['analytics', 'merchants-all'], queryFn: () => fetchMerchants({ page: 1 }), staleTime: 120_000 },
      { queryKey: ['analytics', 'featured-listings'], queryFn: () => fetchListings({ is_featured: true }), staleTime: 120_000 },
    ],
  })

  const [products, services, verified, allMerchants, featured] = results
  const isLoading = results.some(r => r.isLoading)

  const productCount = products.data?.count ?? 0
  const serviceCount = services.data?.count ?? 0
  const verifiedCount = verified.data?.count ?? 0
  const totalMerchants = allMerchants.data?.count ?? 0
  const unverifiedCount = totalMerchants - verifiedCount
  const featuredCount = featured.data?.count ?? 0

  const typeData = [
    { name: 'Products', value: productCount },
    { name: 'Services', value: serviceCount },
  ]

  const merchantData = [
    { name: 'Verified', value: verifiedCount },
    { name: 'Unverified', value: unverifiedCount },
  ]

  const barData = [
    { name: 'Products', count: productCount },
    { name: 'Services', count: serviceCount },
    { name: 'Featured', count: featuredCount },
    { name: 'Verified Mchts', count: verifiedCount },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Products" value={productCount} icon={ListChecks} color="amber" loading={isLoading} />
        <KPICard label="Services" value={serviceCount} icon={TrendingUp} color="blue" loading={isLoading} />
        <KPICard label="Verified Merchants" value={verifiedCount} icon={CheckCircle} color="green" loading={isLoading} />
        <KPICard label="Featured Listings" value={featuredCount} icon={Store} color="purple" loading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Listing Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Listing Types</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name ?? ''} ${(((percent as number | undefined) ?? 0) * 100).toFixed(0)}%`}>
                  {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Merchant Verification</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={merchantData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name ?? ''} ${(((percent as number | undefined) ?? 0) * 100).toFixed(0)}%`}>
                  {merchantData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
