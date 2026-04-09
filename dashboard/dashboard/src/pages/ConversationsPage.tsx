import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Paperclip, MessageSquare, ShoppingBag } from 'lucide-react'
import { useConversations, useMessages, useSendMessage } from '@/hooks/useConversations'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatDateTime, getInitials } from '@/lib/utils'
import type { Conversation, Message } from '@/types'

// ─── Status badge ────────────────────────────────────────────────────────────
function ConvStatusBadge({ status }: { status: Conversation['status'] }) {
  if (status === 'ACTIVE') return <Badge variant="success">Active</Badge>
  if (status === 'ARCHIVED') return <Badge variant="muted">Archived</Badge>
  return <Badge variant="destructive">Blocked</Badge>
}

// ─── Conversation list item ──────────────────────────────────────────────────
function ConvItem({ conv, selected, onClick }: { conv: Conversation; selected: boolean; onClick: () => void }) {
  const unread = parseInt(conv.unread_count, 10) || 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3.5 border-b border-border transition-colors hover:bg-accent/60',
        selected && 'bg-primary/5 border-l-2 border-l-primary',
      )}
    >
      {/* Participants row */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-semibold truncate">{conv.buyer_name}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">→</span>
          <span className="text-sm text-muted-foreground truncate">{conv.seller_name}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {unread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {conv.last_message_at ? formatDateTime(conv.last_message_at) : formatDateTime(conv.created_at)}
          </span>
        </div>
      </div>

      {/* Listing context */}
      {conv.listing_title && (
        <div className="flex items-center gap-1 mb-1">
          <ShoppingBag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{conv.listing_title}</span>
        </div>
      )}

      {/* Last message preview */}
      {conv.last_message ? (
        <p className="text-xs text-muted-foreground truncate">
          <span className="font-medium text-foreground/70">{conv.last_message.sender_name}:</span>{' '}
          {conv.last_message.message}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground italic">No messages yet</p>
      )}
    </button>
  )
}

// ─── Message bubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg, buyerId }: { msg: Message; buyerId: string }) {
  const isBuyer = msg.sender === buyerId

  return (
    <div className={cn('flex gap-2.5 max-w-[75%]', isBuyer ? 'self-start' : 'self-end flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold',
        isBuyer ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700',
      )}>
        {getInitials(msg.sender_name)}
      </div>

      <div className={cn('flex flex-col gap-0.5', isBuyer ? 'items-start' : 'items-end')}>
        <span className="text-[10px] text-muted-foreground px-1">{msg.sender_name}</span>
        <div className={cn(
          'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
          isBuyer
            ? 'bg-secondary text-foreground rounded-tl-sm'
            : 'bg-primary text-white rounded-tr-sm',
        )}>
          {msg.message}
          {msg.attachment && /^https?:\/\//.test(msg.attachment) && (
            <a
              href={msg.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 flex items-center gap-1 text-xs opacity-80 hover:opacity-100 underline"
            >
              <Paperclip className="h-3 w-3" /> Attachment
            </a>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">{formatDateTime(msg.sent_at)}</span>
      </div>
    </div>
  )
}

// ─── Message thread ──────────────────────────────────────────────────────────
function MessageThread({ conv }: { conv: Conversation }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conv.id)
  const sendMsg = useSendMessage(conv.id)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const allMessages = data?.pages.flatMap(p => p.results) ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  function handleSend() {
    if (!draft.trim()) return
    sendMsg.mutate(draft.trim(), { onSuccess: () => setDraft('') })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 flex-shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{conv.buyer_name} ↔ {conv.seller_name}</p>
            <ConvStatusBadge status={conv.status} />
          </div>
          {conv.listing_title && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Re: {conv.listing_title}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground flex-shrink-0">
          {allMessages.length} messages
        </p>
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center py-2 border-b border-border flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => void fetchNextPage()} loading={isFetchingNextPage}>
            Load earlier messages
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <p className="text-sm">No messages in this conversation</p>
          </div>
        ) : (
          allMessages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} buyerId={conv.buyer} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="flex-shrink-0 border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="flex-1"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          />
          <Button onClick={handleSend} disabled={!draft.trim()} loading={sendMsg.isPending} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Messages are sent as the authenticated admin account
        </p>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ConversationsPage() {
  const [sp, setSp] = useSearchParams()
  const page = parseInt(sp.get('page') ?? '1', 10)
  const search = sp.get('search') ?? ''
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading, error } = useConversations({
    page,
    ...(search ? { search } : {}),
  })

  const totalPages = Math.ceil((data?.count ?? 0) / 20)
  const selected = data?.results.find(c => c.id === selectedId) ?? null

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Unable to load conversations. Authentication required.</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Left panel — conversation list */}
      <div className="flex w-80 flex-shrink-0 flex-col border-r border-border">
        {/* Search */}
        <div className="border-b border-border p-3">
          <SearchInput
            value={search}
            onChange={v => {
              const n = new URLSearchParams(sp)
              if (v) n.set('search', v); else n.delete('search')
              n.delete('page')
              setSp(n)
            }}
            placeholder="Search conversations…"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-4 py-3.5 border-b border-border space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-32 rounded shimmer" />
                  <div className="h-3 w-16 rounded shimmer" />
                </div>
                <div className="h-3 w-48 rounded shimmer" />
                <div className="h-3 w-40 rounded shimmer" />
              </div>
            ))
          ) : !data?.results.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <MessageSquare className="h-7 w-7 opacity-30" />
              <p className="text-xs">No conversations found</p>
            </div>
          ) : (
            data.results.map(conv => (
              <ConvItem
                key={conv.id}
                conv={conv}
                selected={selectedId === conv.id}
                onClick={() => setSelectedId(conv.id)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="border-t border-border">
            <Pagination
              page={page}
              totalPages={totalPages}
              count={data.count}
              onPage={p => {
                const n = new URLSearchParams(sp)
                n.set('page', String(p))
                setSp(n)
                setSelectedId(null)
              }}
            />
          </div>
        )}
      </div>

      {/* Right panel — message thread */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selected ? (
          <MessageThread conv={selected} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <div className="rounded-full bg-muted p-5">
              <MessageSquare className="h-10 w-10 opacity-40" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Select a conversation</p>
              <p className="text-sm mt-0.5">Choose a conversation from the list to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
