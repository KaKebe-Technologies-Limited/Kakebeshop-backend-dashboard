import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useListingReviews, useMerchantReviews, useMerchantScores, useReviewMutations } from '@/hooks/useReports'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { StarRating } from '@/components/shared/StarRating'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/utils'
import type { ListingReview, MerchantReview, MerchantScore } from '@/types'

type Tab = 'listing' | 'merchant' | 'scores'

export default function ReviewsPage() {
  const [tab, setTab] = useState<Tab>('listing')
  const [sp, setSp] = useSearchParams()
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'listing' | 'merchant' } | null>(null)

  const page = parseInt(sp.get('page') ?? '1', 10)
  const rating = sp.get('rating') ?? ''

  const { deleteListingReview, deleteMerchantReview, isDeletingListing, isDeletingMerchant } = useReviewMutations()

  function set(key: string, val: string) {
    const next = new URLSearchParams(sp)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSp(next)
  }

  function switchTab(t: Tab) {
    setTab(t)
    setSp(new URLSearchParams())
  }

  async function handleDelete() {
    if (!confirmDelete) return
    if (confirmDelete.type === 'listing') await deleteListingReview(confirmDelete.id)
    else await deleteMerchantReview(confirmDelete.id)
    setConfirmDelete(null)
  }

  const listingQuery = useListingReviews(
    tab === 'listing' ? { page, ...(rating ? { rating } : {}), ordering: '-created_at' } : {}
  )
  const merchantQuery = useMerchantReviews(
    tab === 'merchant' ? { page, ...(rating ? { rating } : {}), ordering: '-created_at' } : {}
  )
  const scoresQuery = useMerchantScores(
    tab === 'scores' ? { page, ordering: '-score' } : {}
  )

  const activeData = tab === 'listing' ? listingQuery.data : tab === 'merchant' ? merchantQuery.data : scoresQuery.data
  const isLoading = tab === 'listing' ? listingQuery.isLoading : tab === 'merchant' ? merchantQuery.isLoading : scoresQuery.isLoading
  const totalPages = activeData?.total_pages ?? Math.ceil((activeData?.count ?? 0) / 20)

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['listing', 'merchant', 'scores'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={[
              'px-4 py-2 text-sm font-medium capitalize transition-colors',
              tab === t
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t === 'listing' ? 'Listing Reviews' : t === 'merchant' ? 'Merchant Reviews' : 'Merchant Scores'}
          </button>
        ))}
      </div>

      {/* Filters — not shown on scores tab */}
      {tab !== 'scores' && (
        <div className="flex flex-wrap items-center gap-3">
          <Select value={rating} onChange={e => set('rating', e.target.value)} className="w-40">
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map(r => (
              <option key={r} value={String(r)}>{r} star{r !== 1 ? 's' : ''}</option>
            ))}
          </Select>
          {rating && (
            <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
          )}
        </div>
      )}

      {/* Listing Reviews */}
      {tab === 'listing' && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={8} cols={6} />
            ) : (
              <TableBody>
                {!(listingQuery.data?.results?.length) ? (
                  <TableEmpty colSpan={6} message="No listing reviews found." />
                ) : (
                  (listingQuery.data.results ?? []).map((r: ListingReview) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm max-w-[160px] truncate">
                        {r.listing_title ?? r.listing}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.user_name}</TableCell>
                      <TableCell><StarRating rating={r.rating} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                        {r.comment ?? <span className="italic">No comment</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setConfirmDelete({ id: r.id, type: 'listing' })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
          {listingQuery.data && (
            <Pagination page={page} totalPages={totalPages} count={listingQuery.data.count} onPage={p => set('page', String(p))} />
          )}
        </Card>
      )}

      {/* Merchant Reviews */}
      {tab === 'merchant' && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={8} cols={6} />
            ) : (
              <TableBody>
                {!(merchantQuery.data?.results?.length) ? (
                  <TableEmpty colSpan={6} message="No merchant reviews found." />
                ) : (
                  (merchantQuery.data.results ?? []).map((r: MerchantReview) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm max-w-[160px] truncate">
                        {r.merchant_name ?? r.merchant}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.user_name}</TableCell>
                      <TableCell><StarRating rating={r.rating} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                        {r.comment ?? <span className="italic">No comment</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setConfirmDelete({ id: r.id, type: 'merchant' })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
          {merchantQuery.data && (
            <Pagination page={page} totalPages={totalPages} count={merchantQuery.data.count} onPage={p => set('page', String(p))} />
          )}
        </Card>
      )}

      {/* Merchant Scores */}
      {tab === 'scores' && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={8} cols={4} />
            ) : (
              <TableBody>
                {!(scoresQuery.data?.results?.length) ? (
                  <TableEmpty colSpan={4} message="No merchant scores found." />
                ) : (
                  (scoresQuery.data.results ?? []).map((s: MerchantScore) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{s.merchant_name ?? s.merchant}</TableCell>
                      <TableCell><StarRating rating={s.score} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.review_count ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.updated_at ? formatDateTime(s.updated_at) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
          {scoresQuery.data && (
            <Pagination page={page} totalPages={totalPages} count={scoresQuery.data.count} onPage={p => set('page', String(p))} />
          )}
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Review"
        size="sm"
      >
        <p className="text-sm text-muted-foreground mb-4">
          This review will be permanently deleted and cannot be restored.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeletingListing || isDeletingMerchant}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
