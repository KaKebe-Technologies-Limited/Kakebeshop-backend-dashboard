import { useBanners } from '@/hooks/useReports'
import { verifyBanner, unverifyBanner } from '@/api/reports'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
import { queryKeys } from '@/lib/queryKeys'
import { Eye, MousePointer } from 'lucide-react'

export default function BannersPage() {
  const { data, isLoading } = useBanners()
  const qc = useQueryClient()
  const verify = useMutation({ mutationFn: (id: string) => verifyBanner(id), onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.banners.all }) })
  const unverify = useMutation({ mutationFn: (id: string) => unverifyBanner(id), onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.banners.all }) })

  return (
    <div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="aspect-[2/1] shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-32 rounded shimmer" />
                <div className="h-3 w-24 rounded shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.results.map(b => (
            <Card key={b.id} className="overflow-hidden">
              <div className="relative aspect-[2/1] bg-muted">
                <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <ActiveBadge active={b.is_active} />
                  {b.is_verified && <Badge variant="success">Verified</Badge>}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {b.placement} · {formatDate(b.start_date)} – {formatDate(b.end_date)}
                  </p>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{(b.impression_count ?? 0).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><MousePointer className="h-3 w-3" />{(b.click_count ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  {b.is_verified ? (
                    <Button size="sm" variant="outline" onClick={() => unverify.mutate(b.id)} loading={unverify.isPending}>
                      Unverify
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => verify.mutate(b.id)} loading={verify.isPending}>
                      Verify
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
