import { useSearchParams } from 'react-router-dom'
import { useListings } from '@/hooks/useListings'
import { useCategories } from '@/hooks/useCategories'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ListingTypeBadge } from '@/components/shared/StatusBadge'
import { MerchantAvatar } from '@/components/shared/MerchantAvatar'
import { Badge } from '@/components/ui/badge'
import { formatPriceRange, formatDate } from '@/lib/utils'
import type { Listing } from '@/types'

export default function ListingsPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)
  const search = sp.get('search') ?? ''
  const type = sp.get('type') ?? ''
  const featured = sp.get('featured') ?? ''
  const category = sp.get('category') ?? ''

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  const { data, isLoading } = useListings({
    page,
    search: search || undefined,
    listing_type: type as 'PRODUCT' | 'SERVICE' | '',
    is_featured: featured === 'true' ? true : '',
    ordering: '-created_at',
  })

  const { data: catData } = useCategories({ page: 1 })
  const totalPages = data?.total_pages ?? Math.ceil((data?.count ?? 0) / 20)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={v => set('search', v)} placeholder="Search listings…" className="w-64" />
        <Select value={type} onChange={e => set('type', e.target.value)} className="w-36">
          <option value="">All types</option>
          <option value="PRODUCT">Products</option>
          <option value="SERVICE">Services</option>
        </Select>
        <Select value={featured} onChange={e => set('featured', e.target.value)} className="w-40">
          <option value="">All listings</option>
          <option value="true">Featured only</option>
        </Select>
        <Select value={category} onChange={e => set('category', e.target.value)} className="w-44">
          <option value="">All categories</option>
          {catData?.results.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        {(search || type || featured || category) && (
          <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Title</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton rows={10} cols={9} />
          ) : (
            <TableBody>
              {!data?.results.length ? (
                <TableEmpty colSpan={9} />
              ) : (
                data.results.map((l: Listing) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      {l.primary_image ? (
                        <img src={l.primary_image.image} alt="" className="h-9 w-9 rounded object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium max-w-[180px] truncate">{l.title}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MerchantAvatar logo={l.merchant.logo} name={l.merchant.display_name} size="sm" />
                        <span className="text-xs truncate max-w-[100px]">{l.merchant.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell><ListingTypeBadge type={l.listing_type} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.category_name}</TableCell>
                    <TableCell className="text-xs font-medium">
                      {formatPriceRange(l.price_type, l.price, l.price_min, l.price_max)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.views_count.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {l.is_verified && <Badge variant="success">Verified</Badge>}
                        {l.is_featured && <Badge variant="warning">Featured</Badge>}
                        {!l.is_verified && !l.is_featured && <Badge variant="muted">—</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(l.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          )}
        </Table>
        {data && (
          <Pagination page={page} totalPages={totalPages} count={data.count} onPage={p => set('page', String(p))} />
        )}
      </Card>
    </div>
  )
}
