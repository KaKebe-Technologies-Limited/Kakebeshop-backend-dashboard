# Kakebe Shop Dashboard - Features Integration

This document outlines the features integrated into the Kakebe Shop dashboard.

## Features Added

### 1. Custom Admin Authentication System

**Files Created/Modified:**
- `src/api/adminAuth.ts` - Admin authentication API service
- `src/stores/authStore.ts` - Updated to support admin authentication
- `src/pages/LoginPage.tsx` - Updated to use admin auth
- `src/types/index.ts` - Added admin user types

**Features:**
- Separate admin user system (not using Django's user model)
- JWT token-based authentication
- Admin role management (SUPER_ADMIN, MODERATOR, VIEWER)
- Session persistence and automatic logout on token expiration

### 2. User Registration Management

**Files Created:**
- `src/api/userRegistrations.ts` - User registration API service
- `src/pages/UserRegistrationsPage.tsx` - User registration management page

**Features:**
- View pending user registrations
- Approve/reject registrations with notes
- Search and filter registrations
- Real-time ntfy notifications when approving registrations

### 3. Enhanced Order Creation

**Files Modified:**
- `src/api/orders.ts` - Added order creation methods
- `src/components/OrderCreationForm.tsx` - Order creation form component

**Features:**
- Admin-side order creation
- Multiple item support per order
- Delivery fee and notes support
- Real-time ntfy notifications for new orders

### 4. Visitor Tracking & Analytics

**Files Created:**
- `src/api/visitorTracking.ts` - Visitor tracking API service
- `src/pages/VisitorAnalyticsPage.tsx` - Visitor analytics dashboard
- `src/hooks/useVisitorTracking.ts` - Visitor tracking hook

**Features:**
- Real-time visitor tracking
- Page view analytics
- Product view tracking
- Bot detection and filtering
- Session management
- Visitor analytics dashboard

### 5. ntfy Integration

**Files Created:**
- `src/services/ntfyService.ts` - ntfy notification service

**Features:**
- Real-time notifications for:
  - New user registrations
  - New orders placed
  - Product page views
  - General page views
- Bot detection to filter out crawler notifications
- Configurable notification topics and priorities
- Custom notification tags and formatting

---

## NEW FEATURES (Latest Update)

### 6. Enhanced Role-Based Access Control (RBAC)

**Files Created/Modified:**
- `src/stores/authStore.ts` - Enhanced with permissions system
- `src/components/layout/RoleGuard.tsx` - Updated to support permission-based access
- `src/pages/RoleManagementPage.tsx` - NEW: Role and staff management page
- `src/components/layout/Sidebar.tsx` - Updated with role management navigation
- `src/router/index.tsx` - Added role management route

**Features:**
- **5 role levels**: Super Admin, Admin, Moderator, Support, Viewer
- **Granular permissions**: 25+ specific permissions per role
- **Role hierarchy**: Higher roles can manage lower roles
- **Permission-based access control**: Components can check specific permissions
- **Role management UI**: Super admins can create/edit admin users and assign roles
- **Visual role indicators**: Color-coded badges for different roles
- **Role-based sidebar**: Navigation items shown based on permissions

**Permissions by Role:**
- **Super Admin**: All permissions including role management, system configuration
- **Admin**: Most permissions except role management and system configuration
- **Moderator**: Content management (orders, merchants, listings, reviews)
- **Support**: View-only access to dashboard and reports, conversation management
- **Viewer**: Read-only access to dashboard, analytics, and reports

### 7. Advanced Visitor Analytics with Charts and Graphs

**Files Modified:**
- `src/pages/VisitorAnalyticsPage.tsx` - Completely redesigned with advanced charts

**Features:**
- **Time range selection**: 24h, 7d, 30d views
- **Area charts**: Visitor trends, page views, and bot traffic over time
- **Pie charts**: Device breakdown (desktop/mobile/tablet)
- **Geographic distribution**: Visitor locations with progress bars
- **Bot vs Human visualization**: Pie chart showing traffic composition
- **Real-time updates**: Auto-refreshes every 30 seconds
- **Enhanced KPIs**: Total visitors, active visitors, page views, bot percentage
- **Top pages and products**: Tables with view counts
- **Real-time visitor table**: Live session tracking

### 8. Bulk Operations for User Registrations and Orders

**Files Created:**
- `src/api/bulkOperations.ts` - Bulk operation API service

**Files Modified:**
- `src/pages/UserRegistrationsPage.tsx` - Added bulk approve/reject
- `src/pages/OrdersPage.tsx` - Added bulk status updates and export

**Features:**

**User Registrations:**
- Select multiple pending registrations with checkboxes
- Bulk approve selected registrations
- Bulk reject selected registrations
- Select all pending registrations at once
- Confirmation dialogs for bulk actions
- Visual selection highlighting

**Orders:**
- Select multiple orders with checkboxes
- Bulk status updates (confirm, complete, cancel)
- Export orders to CSV
- Select all orders at once
- Confirmation dialogs for bulk actions
- Permission-based bulk operations

### 9. Multi-Channel Notification Services

**Files Created:**
- `src/services/notificationService.ts` - Unified multi-channel notification service

**Features:**
- **4 notification channels**:
  - ntfy (existing)
  - Email (NEW)
  - SMS (NEW)
  - In-app notifications (NEW)
- **Convenience methods**:
  - `notifyOrderCreated()`
  - `notifyRegistrationApproved()`
  - `notifyOrderStatusChanged()`
- **Email notifications**: HTML-formatted order and registration updates
- **SMS notifications**: Truncated messages for mobile delivery
- **In-app notifications**: Database-stored notifications for users
- **Automatic channel selection**: Based on recipient availability
- **Error handling**: Graceful degradation if a channel fails
- **Configurable**: Environment variables for API keys

**Integration:**
- User registration approvals now send email + ntfy notifications
- Orders can trigger multi-channel notifications
- All notification services are centralized for easy maintenance

### 10. Real-time Dashboard Updates Using WebSockets

**Files Created:**
- `src/services/websocketService.ts` - WebSocket service with reconnection
- `src/components/RealtimeProvider.tsx` - Real-time event handler wrapper

**Files Modified:**
- `src/App.tsx` - Added RealtimeProvider wrapper
- `src/components/layout/Topbar.tsx` - Added real-time connection indicator

**Features:**
- **Automatic WebSocket connection**: Connects when user is authenticated
- **Auto-reconnection**: Exponential backoff strategy (up to 10 attempts)
- **Real-time events supported**:
  - `new_order`: Invalidate orders cache, show browser notification
  - `order_status_changed`: Invalidate order details
  - `new_registration`: Invalidate registrations list
  - `registration_approved`: Invalidate registrations list
  - `visitor_count_changed`: Invalidate visitor analytics
  - `notification`: Handle in-app notifications
  - `ping/pong`: Keep-alive mechanism
- **Browser notifications**: Requests permission and shows native notifications
- **Connection indicator**: Live/Offline badge in topbar
- **Query invalidation**: Automatically refreshes affected data
- **Token-based authentication**: WebSocket auth via JWT token
- **Graceful disconnect**: Clean shutdown on logout

---

## API Endpoints Required

The following backend API endpoints are required for full functionality:

### Admin Authentication
- `POST /api/v1/admin/auth/login/` - Admin login
- `POST /api/v1/admin/auth/logout/` - Admin logout
- `POST /api/v1/admin/auth/token/refresh/` - Token refresh
- `GET /api/v1/admin/profile/` - Get admin profile

### User Registration Management
- `GET /api/v1/admin/user-registrations/` - List registrations
- `PATCH /api/v1/admin/user-registrations/{id}/approve/` - Approve registration
- `PATCH /api/v1/admin/user-registrations/{id}/reject/` - Reject registration
- `POST /api/v1/admin/user-registrations/bulk-approve/` - Bulk approve (NEW)
- `POST /api/v1/admin/user-registrations/bulk-reject/` - Bulk reject (NEW)

### Visitor Tracking
- `POST /api/v1/admin/visitor-tracking/` - Track visitor activity
- `GET /api/v1/admin/visitor-tracking/analytics/` - Get analytics
- `GET /api/v1/admin/visitor-tracking/realtime/` - Get real-time visitors
- `GET /api/v1/admin/visitor-tracking/sessions/{id}/` - Get session details

### Enhanced Orders
- `POST /api/v1/orders/create/` - Create order
- `POST /api/v1/orders/bulk-create/` - Bulk order creation
- `POST /api/v1/orders/bulk-update-status/` - Bulk status update (NEW)
- `POST /api/v1/orders/export/` - Export orders as CSV (NEW)

### Role Management (NEW)
- `GET /api/v1/admin/users` - List admin users
- `POST /api/v1/admin/users` - Create admin user
- `PATCH /api/v1/admin/users/{id}/role` - Update user role

### Notifications (NEW)
- `POST /api/v1/notifications/email` - Send email notification
- `POST /api/v1/notifications/sms` - Send SMS notification
- `POST /api/v1/notifications/in-app` - Create in-app notification

### WebSocket (NEW)
- `WS /ws/dashboard` - WebSocket endpoint for real-time updates

## Usage

### Admin Login
1. Navigate to `/login`
2. Enter admin credentials (email and password)
3. Dashboard will redirect to overview page

### User Registration Management
1. Navigate to `/user-registrations`
2. View pending registrations in the table
3. **Bulk operations**: Select multiple registrations using checkboxes
4. Click "Approve Selected" or "Reject Selected" for bulk actions
5. Click individual approve/reject buttons for single actions
6. Add review notes as needed

### Role Management (Super Admin Only)
1. Navigate to `/role-management`
2. View all admin users and their roles
3. Click "Add User" to create new admin users
4. Click edit icon to change user roles
5. Reference panel shows permissions for each role

### Order Creation
1. Navigate to `/orders`
2. Use the order creation form to create new orders
3. Add multiple items, set delivery fees, and add notes
4. Submit to create the order

### Bulk Order Operations
1. Navigate to `/orders`
2. Select multiple orders using checkboxes
3. Use the bulk action bar to:
   - Change status for all selected orders
   - Export orders to CSV
4. Confirm the action in the dialog

### Visitor Analytics
1. Navigate to `/visitor-analytics`
2. View real-time visitor statistics
3. Select time range (24h, 7d, 30d)
4. Monitor charts for visitor trends, device breakdown, and geographic distribution
5. Track current active sessions

### ntfy Notifications
1. Configure ntfy topic in `src/services/ntfyService.ts`
2. Notifications will be sent automatically for:
   - New user registrations (when approved)
   - New orders placed
   - Product page views (excluding bots)
   - General page views (excluding bots)

### Multi-Channel Notifications
1. Configure email/SMS API keys in `.env.local`:
   ```env
   VITE_EMAIL_API_KEY=your_email_api_key
   VITE_EMAIL_FROM=noreply@kakebe.shop
   VITE_SMS_API_KEY=your_sms_api_key
   VITE_SMS_FROM=+1234567890
   ```
2. Notifications will be sent via email, SMS, and in-app based on recipient availability

### Real-time Updates
1. WebSocket connects automatically when authenticated
2. Connection status shown in topbar (Live/Offline indicator)
3. Browser notifications for new orders (after granting permission)
4. Data auto-refreshes when events are received

## Bot Detection

The system includes comprehensive bot detection to filter out crawler traffic:

```typescript
function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /google/i, /bing/i, /yahoo/i, /facebook/i,
    /twitter/i, /linkedin/i, /whatsapp/i, /telegram/i,
    /applebot/i, /yandex/i, /baidu/i, /duckduckbot/i
  ]
  return botPatterns.some(pattern => pattern.test(userAgent))
}
```

## Security Considerations

- JWT tokens are stored securely in localStorage
- Automatic logout on 401 responses
- Admin authentication separate from user authentication
- Bot detection prevents spam notifications
- Input validation and sanitization
- **Role-based permissions**: Users only see/access what their role allows
- **WebSocket authentication**: Secure real-time connections via JWT
- **Permission checks**: Bulk operations require specific permissions

## Future Enhancements

- Advanced visitor analytics with custom date ranges (beyond 30d)
- Integration with additional notification providers (Slack, Discord, etc.)
- Real-time collaborative features (multiple admin editing)
- Advanced audit logging with WebSocket events
- Push notification customization per user
- Bulk import/export for all entities
- Automated role assignment based on rules
- Dashboard widget customization
- Advanced analytics with predictive insights
