# Kakebe Shop Dashboard - New Features Integration

This document outlines the new features integrated into the Kakebe Shop dashboard.

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

### Visitor Tracking
- `POST /api/v1/admin/visitor-tracking/` - Track visitor activity
- `GET /api/v1/admin/visitor-tracking/analytics/` - Get analytics
- `GET /api/v1/admin/visitor-tracking/realtime/` - Get real-time visitors
- `GET /api/v1/admin/visitor-tracking/sessions/{id}/` - Get session details

### Enhanced Orders
- `POST /api/v1/orders/create/` - Create order
- `POST /api/v1/orders/bulk-create/` - Bulk order creation

## Usage

### Admin Login
1. Navigate to `/login`
2. Enter admin credentials (email and password)
3. Dashboard will redirect to overview page

### User Registration Management
1. Navigate to `/user-registrations`
2. View pending registrations in the table
3. Click approve/reject buttons to manage registrations
4. Add review notes as needed

### Order Creation
1. Navigate to `/orders`
2. Use the order creation form to create new orders
3. Add multiple items, set delivery fees, and add notes
4. Submit to create the order

### Visitor Analytics
1. Navigate to `/visitor-analytics`
2. View real-time visitor statistics
3. Monitor top pages and products
4. Track current active sessions

### ntfy Notifications
1. Configure ntfy topic in `src/services/ntfyService.ts`
2. Notifications will be sent automatically for:
   - New user registrations (when approved)
   - New orders placed
   - Product page views (excluding bots)
   - General page views (excluding bots)

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

## Future Enhancements

- Role-based access control for different admin levels
- Advanced visitor analytics with charts and graphs
- Bulk operations for user registrations and orders
- Integration with additional notification services
- Real-time dashboard updates using WebSockets
