// ─── Pagination ─────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number
  total_pages?: number
  current_page?: number
  page_size?: number
  next: string | null
  previous: string | null
  results: T[]
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse {
  name: string
  username: string
  user_id: string
  tokens: string // JSON string of AuthTokens
}

export interface UserProfile {
  id: string
  username: string
  name: string
  email: string
  profile_image: string | null
  phone: string | null
  bio: string | null
  is_verified: boolean
  phone_verified: boolean
  is_merchant: string
  merchant: string | null
  created_at: string
  updated_at: string
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
  parent: string | null
  parent_name: string | null
  children_count: number
  allows_order_intent: boolean
  allows_cart: boolean
  is_contact_only: boolean
  is_featured: boolean
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

// ─── Tag ─────────────────────────────────────────────────────────────────────
export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

// ─── Location ────────────────────────────────────────────────────────────────
export interface MerchantLocation {
  id: string
  region: string
  district: string
  area: string
  latitude: string | null
  longitude: string | null
  address: string | null
  is_active: boolean
  created_at: string
}

// ─── Merchant ────────────────────────────────────────────────────────────────
export interface MerchantListItem {
  id: string
  display_name: string
  business_name: string | null
  logo: string | null
  rating: number
  total_reviews: number
  verified: boolean
  featured: boolean
}

export interface MerchantDetail extends MerchantListItem {
  user_id: string
  username: string
  email: string
  description: string | null
  business_phone: string | null
  location: MerchantLocation | null
  business_email: string | null
  cover_image: string | null
  verification_date: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Listing ─────────────────────────────────────────────────────────────────
export interface ListingImage {
  id: string
  image: string
  width: number
  height: number
  variant: string
  image_group_id: string
}

export interface Listing {
  id: string
  merchant: MerchantListItem
  title: string
  listing_type: 'PRODUCT' | 'SERVICE'
  category_name: string
  price_type: 'FIXED' | 'RANGE'
  price: string | null
  price_min: string | null
  price_max: string | null
  currency: string
  is_featured: boolean
  is_verified: boolean
  views_count: number
  primary_image: ListingImage | null
  created_at: string
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus = 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export interface OrderIntentItem {
  id: string
  listing: string
  listing_title: string
  quantity: number
  unit_price: string
  total_price: string
}

export interface UserAddress {
  id: string
  label: string
  address_line1: string
  address_line2: string | null
  region: string
  district: string
  area: string
  is_default: boolean
}

export interface Order {
  id: string
  order_number: string
  buyer: string
  buyer_name: string
  merchant: string
  merchant_name: string
  address: UserAddress | null
  notes: string | null
  total_amount: string
  delivery_fee: string | null
  expected_delivery_date: string | null
  status: OrderStatus
  created_at: string
  updated_at: string
  items: OrderIntentItem[]
  order_group: string | null
  order_group_number: string | null
  is_grouped: string
}

export interface OrderGroup {
  id: string
  group_number: string
  buyer: string
  buyer_name: string
  total_amount: string
  total_orders: number
  created_at: string
  orders: Order[]
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CARD'
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

export interface Transaction {
  id: string
  transaction_number: string
  order_intent: string
  order_number: string
  amount: string
  currency: string
  payment_method: PaymentMethod
  payment_reference: string | null
  status: TransactionStatus
  completed_at: string | null
  created_at: string
  buyer: string
  merchant: string
  total_amount: string
}

// ─── Report ──────────────────────────────────────────────────────────────────
export type ReportReason = 'SPAM' | 'INAPPROPRIATE' | 'SCAM' | 'FAKE' | 'OFFENSIVE' | 'OTHER'
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'

export interface Report {
  id: string
  reason: ReportReason
  description: string
  status: ReportStatus
  review_notes: string | null
  created_at: string
  updated_at: string
  reporter: string
  listing: string | null
  merchant: string | null
  reported_user: string | null
  reviewed_by: string | null
}

// ─── Notification ────────────────────────────────────────────────────────────
export type NotificationType =
  | 'ORDER_CREATED' | 'ORDER_CONTACTED' | 'ORDER_CONFIRMED'
  | 'ORDER_COMPLETED' | 'ORDER_CANCELLED' | 'MERCHANT_NEW_ORDER'
  | 'MERCHANT_APPROVED' | 'MERCHANT_DEACTIVATED' | 'MERCHANT_SUSPENDED'
  | 'LISTING_APPROVED' | 'LISTING_REJECTED'

export interface Notification {
  id: string
  notification_type: NotificationType
  title: string
  message: string
  order_id: string | null
  merchant_id: string | null
  listing_id: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  created_at: string
}

// ─── Banner ──────────────────────────────────────────────────────────────────
export type BannerPlacement = 'HOME_TOP' | 'HOME_MIDDLE' | 'CATEGORY' | 'SEARCH'

export interface Banner {
  id: string
  title: string
  image: string
  link_url: string | null
  placement: BannerPlacement
  is_active: boolean
  is_verified: boolean
  click_count: number
  impression_count: number
  start_date: string | null
  end_date: string | null
  created_at: string
}

// ─── Review ──────────────────────────────────────────────────────────────────
export interface ListingReview {
  id: string
  listing: string
  rating: number
  comment: string | null
  user_name: string
  created_at: string
  updated_at: string
}

export interface MerchantReview {
  id: string
  merchant: string
  rating: number
  comment: string | null
  user_name: string
  created_at: string
  updated_at: string
}

// ─── Audit Log ───────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  admin: string | null
}

// ─── Conversation ────────────────────────────────────────────────────────────
export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED'

export interface Message {
  id: string
  sender: string
  sender_name: string
  message: string
  attachment: string | null
  is_read: boolean
  sent_at: string
}

export interface Conversation {
  id: string
  listing: string | null
  listing_title: string | null
  order_intent: string | null
  buyer: string
  buyer_name: string
  seller: string
  seller_name: string
  status: ConversationStatus
  last_message_at: string | null
  created_at: string
  last_message: Message | null
  unread_count: string
}
