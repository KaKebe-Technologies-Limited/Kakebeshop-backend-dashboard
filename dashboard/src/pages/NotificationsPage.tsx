import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bell, Smartphone, CheckCheck } from 'lucide-react'
import { useNotifications, usePushTokens, useNotificationMutations } from '@/hooks/useReports'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Pagination } from '@/components/shared/Pagination'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { Notification, PushToken } from '@/types'

type Tab = 'notifications' | 'push-tokens'

const typeLabels: Record<string, string> = {
  ORDER_CREATED: 'Order Created',
  ORDER_CONTACTED: 'Order Contacted',
  ORDER_CONFIRMED: 'Order Confirmed',
  ORDER_COMPLETED: 'Order Completed',
  ORDER_CANCELLED: 'Order Cancelled',
  MERCHANT_NEW_ORDER: 'New Order',
  MERCHANT_APPROVED: 'Merchant Approved',
  MERCHANT_DEACTIVATED: 'Merchant Deactivated',
  MERCHANT_SUSPENDED: 'Merchant Suspended',
  LISTING_APPROVED: 'Listing Approved',
  LISTING_REJECTED: 'Listing Rejected',
}

const typeVariant: Record<string, 'success' | 'info' | 'warning' | 'destructive' | 'muted'> = {
  ORDER_CREATED: 'info',
  ORDER_CONTACTED: 'info',
  ORDER_CONFIRMED: 'success',
  ORDER_COMPLETED: 'success',
  ORDER_CANCELLED: 'destructive',
  MERCHANT_NEW_ORDER: 'info',
  MERCHANT_APPROVED: 'success',
  MERCHANT_DEACTIVATED: 'warning',
  MERCHANT_SUSPENDED: 'warning',
  LISTING_APPROVED: 'success',
  LISTING_REJECTED: 'destructive',
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('notifications')
  const [sp, setSp] = useSearchParams()

  const page = parseInt(sp.get('page') ?? '1', 10)
  const isRead = sp.get('is_read') ?? ''
  const notifType = sp.get('type') ?? ''

  const { markRead, markAllRead, isMarkingAll } = useNotificationMutations()

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

  const notifQuery = useNotifications(
    tab === 'notifications'
      ? {
          page,
          ...(isRead !== '' ? { is_read: isRead } : {}),
          ...(notifType ? { notification_type: notifType } : {}),
          ordering: '-created_at',
        }
      : {}
  )
  const pushQuery = usePushTokens()

  const totalPages = notifQuery.data?.total_pages ?? Math.ceil((notifQuery.data?.count ?? 0) / 20)
  const unreadCount = notifQuery.data?.results?.filter(n => !n.is_read).length ?? 0

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: 'notifications' as Tab, label: 'Notifications', Icon: Bell },
          { id: 'push-tokens' as Tab, label: 'Push Tokens', Icon: Smartphone },
        ]).map(({ id, label, Icon }) => (
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

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={isRead} onChange={e => set('is_read', e.target.value)} className="w-36">
              <option value="">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </Select>
            <Select value={notifType} onChange={e => set('type', e.target.value)} className="w-48">
              <option value="">All types</option>
              {Object.entries(typeLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
            {(isRead || notifType) && (
              <Button variant="ghost" size="sm" onClick={() => setSp(new URLSearchParams())}>Clear</Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto gap-1.5"
                onClick={() => markAllRead()}
                disabled={isMarkingAll}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              {notifQuery.isLoading ? (
                <TableSkeleton rows={8} cols={7} />
              ) : (
                <TableBody>
                  {!notifQuery.data?.results?.length ? (
                    <TableEmpty colSpan={7} message="No notifications found." />
                  ) : (
                    notifQuery.data.results.map((n: Notification) => (
                      <TableRow key={n.id} className={!n.is_read ? 'bg-muted/30' : ''}>
                        <TableCell>
                          <Badge variant={typeVariant[n.notification_type] ?? 'muted'}>
                            {typeLabels[n.notification_type] ?? n.notification_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium max-w-[160px] truncate">
                          {n.title}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate">
                          {n.message}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {n.user_name ?? n.user ?? '—'}
                        </TableCell>
                        <TableCell>
                          {n.is_read
                            ? <Badge variant="muted">Read</Badge>
                            : <Badge variant="warning">Unread</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(n.created_at)}
                        </TableCell>
                        <TableCell>
                          {!n.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => markRead(n.id)}
                            >
                              Mark read
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              )}
            </Table>
            {notifQuery.data && (
              <Pagination
                page={page}
                totalPages={totalPages}
                count={notifQuery.data.count}
                onPage={p => set('page', String(p))}
              />
            )}
          </Card>
        </>
      )}

      {/* Push Tokens Tab */}
      {tab === 'push-tokens' && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            {pushQuery.isLoading ? (
              <TableSkeleton rows={8} cols={5} />
            ) : (
              <TableBody>
                {!pushQuery.data?.tokens?.length ? (
                  <TableEmpty colSpan={5} message="No push tokens registered." />
                ) : (
                  pushQuery.data.tokens.map((t: PushToken) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">
                        {t.user_name ?? t.user ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {t.platform ?? t.device_type ?? 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[220px] truncate">
                        {t.token}
                      </TableCell>
                      <TableCell>
                        {t.is_active !== undefined
                          ? t.is_active
                            ? <Badge variant="success">Active</Badge>
                            : <Badge variant="muted">Inactive</Badge>
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(t.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </Card>
      )}
    </div>
  )
}
