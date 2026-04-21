export const queryKeys = {
  // Auth
  profile: ['profile'] as const,

  // Public
  categories: {
    all: ['categories'] as const,
    list: (p: Record<string, unknown>) => ['categories', 'list', p] as const,
    tree: ['categories', 'tree'] as const,
    detail: (id: string) => ['categories', id] as const,
  },
  tags: {
    all: ['tags'] as const,
    list: (p: Record<string, unknown>) => ['tags', 'list', p] as const,
  },
  listings: {
    all: ['listings'] as const,
    list: (p: Record<string, unknown>) => ['listings', 'list', p] as const,
    detail: (id: string) => ['listings', id] as const,
    analytics: (id: string) => ['listings', id, 'analytics'] as const,
  },
  merchants: {
    all: ['merchants'] as const,
    list: (p: Record<string, unknown>) => ['merchants', 'list', p] as const,
    detail: (id: string) => ['merchants', id] as const,
    reviews: (id: string) => ['merchants', id, 'reviews'] as const,
  },
  locations: {
    regions: ['locations', 'regions'] as const,
  },

  // Auth-gated
  orders: {
    all: ['orders'] as const,
    list: (p: Record<string, unknown>) => ['orders', 'list', p] as const,
    detail: (id: string) => ['orders', id] as const,
  },
  orderGroups: {
    all: ['order-groups'] as const,
    list: (p: Record<string, unknown>) => ['order-groups', 'list', p] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (p: Record<string, unknown>) => ['transactions', 'list', p] as const,
  },
  reports: {
    all: ['reports'] as const,
    list: (p: Record<string, unknown>) => ['reports', 'list', p] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (p: Record<string, unknown>) => ['notifications', 'list', p] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  pushTokens: {
    all: ['push-tokens'] as const,
    list: () => ['push-tokens', 'list'] as const,
  },
  banners: {
    all: ['banners'] as const,
    list: (p: Record<string, unknown>) => ['banners', 'list', p] as const,
  },
  listingReviews: {
    all: ['listing-reviews'] as const,
    list: (p: Record<string, unknown>) => ['listing-reviews', 'list', p] as const,
  },
  merchantReviews: {
    all: ['merchant-reviews'] as const,
    list: (p: Record<string, unknown>) => ['merchant-reviews', 'list', p] as const,
  },
  merchantScores: {
    all: ['merchant-scores'] as const,
    list: (p: Record<string, unknown>) => ['merchant-scores', 'list', p] as const,
  },
  cartItems: {
    all: ['cart-items'] as const,
    list: (p: Record<string, unknown>) => ['cart-items', 'list', p] as const,
  },
  wishlists: {
    all: ['wishlists'] as const,
    list: (p: Record<string, unknown>) => ['wishlists', 'list', p] as const,
  },
  wishlistItems: {
    all: ['wishlist-items'] as const,
    list: (p: Record<string, unknown>) => ['wishlist-items', 'list', p] as const,
  },
  auditLogs: {
    list: (p: Record<string, unknown>) => ['audit-logs', 'list', p] as const,
  },
  activityLogs: {
    list: (p: Record<string, unknown>) => ['activity-logs', 'list', p] as const,
  },
  conversations: {
    list: (p: Record<string, unknown>) => ['conversations', 'list', p] as const,
  },
}
