import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShoppingCart, Heart, List } from 'lucide-react'
import { useCartItems, useWishlists, useWishlistItems } from '@/hooks/useCart'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { Card } from '@/components/ui/card'
import { formatUGX, formatDateTime } from '@/lib/utils'
import type { CartItem, Wishlist, WishlistItem } from '@/types'

type Tab = 'cart-items' | 'wishlists' | 'wishlist-items'

const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'cart-items', label: 'Cart Items', Icon: ShoppingCart },
  { id: 'wishlists', label: 'Wishlists', Icon: Heart },
  { id: 'wishlist-items', label: 'Wishlist Items', Icon: List },
]

export default function CartWishlistPage() {
  const [tab, setTab] = useState<Tab>('cart-items')
  const [sp, setSp] = useSearchParams()

  const page = parseInt(sp.get('page') ?? '1', 10)

  function setPage(p: number) {
    const next = new URLSearchParams(sp)
    next.set('page', String(p))
    setSp(next)
  }

  function switchTab(t: Tab) {
    setTab(t)
    setSp(new URLSearchParams())
  }

  const cartQuery = useCartItems(
    tab === 'cart-items' ? { page, ordering: '-created_at' } : {}
  )
  const wishlistsQuery = useWishlists(
    tab === 'wishlists' ? { page, ordering: '-created_at' } : {}
  )
  const wishlistItemsQuery = useWishlistItems(
    tab === 'wishlist-items' ? { page, ordering: '-created_at' } : {}
  )

  const activeData =
    tab === 'cart-items' ? cartQuery.data :
    tab === 'wishlists' ? wishlistsQuery.data :
    wishlistItemsQuery.data

  const isLoading =
    tab === 'cart-items' ? cartQuery.isLoading :
    tab === 'wishlists' ? wishlistsQuery.isLoading :
    wishlistItemsQuery.isLoading

  const totalPages = activeData?.total_pages ?? Math.ceil((activeData?.count ?? 0) / 20)

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={[
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors',
              tab === id
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Cart Items */}
      {tab === 'cart-items' && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={8} cols={6} />
            ) : (
              <TableBody>
                {!cartQuery.data?.results?.length ? (
                  <TableEmpty colSpan={6} message="No cart items found." />
                ) : (
                  cartQuery.data.results.map((item: CartItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {item.listing_title ?? item.listing}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.cart_user ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-sm">{formatUGX(item.unit_price)}</TableCell>
                      <TableCell className="text-sm font-semibold">{formatUGX(item.subtotal)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
          {cartQuery.data && (
            <Pagination page={page} totalPages={totalPages} count={cartQuery.data.count} onPage={setPage} />
          )}
        </Card>
      )}

      {/* Wishlists */}
      {tab === 'wishlists' && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={8} cols={4} />
            ) : (
              <TableBody>
                {!wishlistsQuery.data?.results?.length ? (
                  <TableEmpty colSpan={4} message="No wishlists found." />
                ) : (
                  wishlistsQuery.data.results.map((w: Wishlist) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-sm">{w.user_name ?? w.user ?? '—'}</TableCell>
                      <TableCell className="text-sm font-medium">{w.total_items}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(w.created_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {w.updated_at ? formatDateTime(w.updated_at) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
          {wishlistsQuery.data && (
            <Pagination page={page} totalPages={totalPages} count={wishlistsQuery.data.count} onPage={setPage} />
          )}
        </Card>
      )}

      {/* Wishlist Items */}
      {tab === 'wishlist-items' && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={8} cols={3} />
            ) : (
              <TableBody>
                {!wishlistItemsQuery.data?.results?.length ? (
                  <TableEmpty colSpan={3} message="No wishlist items found." />
                ) : (
                  wishlistItemsQuery.data.results.map((item: WishlistItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm max-w-[240px] truncate">
                        {item.listing_title ?? item.listing}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.wishlist_user ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(item.added_at ?? item.created_at ?? '')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
          {wishlistItemsQuery.data && (
            <Pagination page={page} totalPages={totalPages} count={wishlistItemsQuery.data.count} onPage={setPage} />
          )}
        </Card>
      )}
    </div>
  )
}
