import { Badge } from '@/components/ui/badge'
import type { OrderStatus, ReportStatus, TransactionStatus } from '@/types'

export function MerchantStatusBadge({ verified, featured }: { verified: boolean; featured?: boolean }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {verified ? (
        <Badge variant="success">Verified</Badge>
      ) : (
        <Badge variant="muted">Unverified</Badge>
      )}
      {featured && <Badge variant="warning">Featured</Badge>}
    </div>
  )
}

export function MerchantAccountStatusBadge({ status }: { status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' }) {
  const map = {
    ACTIVE: <Badge variant="success">Active</Badge>,
    SUSPENDED: <Badge variant="warning">Suspended</Badge>,
    BANNED: <Badge variant="destructive">Banned</Badge>,
  }
  return map[status] ?? <Badge variant="muted">{status}</Badge>
}

export function ListingTypeBadge({ type }: { type: 'PRODUCT' | 'SERVICE' }) {
  return type === 'PRODUCT'
    ? <Badge variant="info">Product</Badge>
    : <Badge variant="purple">Service</Badge>
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, React.ReactElement> = {
    NEW: <Badge variant="info">New</Badge>,
    CONTACTED: <Badge variant="warning">Contacted</Badge>,
    CONFIRMED: <Badge variant="default">Confirmed</Badge>,
    COMPLETED: <Badge variant="success">Completed</Badge>,
    CANCELLED: <Badge variant="destructive">Cancelled</Badge>,
  }
  return map[status] ?? <Badge variant="muted">{status}</Badge>
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const map: Record<ReportStatus, React.ReactElement> = {
    PENDING: <Badge variant="warning">Pending</Badge>,
    UNDER_REVIEW: <Badge variant="info">Under Review</Badge>,
    RESOLVED: <Badge variant="success">Resolved</Badge>,
    DISMISSED: <Badge variant="muted">Dismissed</Badge>,
  }
  return map[status] ?? <Badge variant="muted">{status}</Badge>
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const map: Record<TransactionStatus, React.ReactElement> = {
    PENDING: <Badge variant="warning">Pending</Badge>,
    COMPLETED: <Badge variant="success">Completed</Badge>,
    FAILED: <Badge variant="destructive">Failed</Badge>,
    REFUNDED: <Badge variant="muted">Refunded</Badge>,
  }
  return map[status] ?? <Badge variant="muted">{status}</Badge>
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active
    ? <Badge variant="success">Active</Badge>
    : <Badge variant="muted">Inactive</Badge>
}
