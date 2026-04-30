# Analytics Dashboard Enhancements Plan

**Date:** 2026-04-30  
**Status:** Planning  
**Priority:** High-Impact Upgrades to Transform Dashboard into Operational Tool

---

## Overview

This plan outlines implementation of three game-changing upgrades to the analytics dashboard:
1. **Real-Time Metrics** (WebSocket live updates)
2. **Anomaly Detection & Alerts** (automated problem detection)
3. **Drill-Down Capabilities** (click-to-explore detail views)

These upgrades transform the dashboard from a read-only scoreboard into an actionable, operational tool.

---

## Phase 1: Real-Time WebSocket Updates

### Problem Solved
Currently: Daily snapshots at 23:59 UTC (data always 1 day old)  
Goal: See metrics update live as orders/users/merchants arrive

### Architecture

```
Backend (Django):
  Orders/Users/Merchants created
    ↓
  Redis Pub/Sub channel notified
    ↓
  Django Signals trigger metrics update
    ↓
  WebSocket broadcasts to connected dashboards
    ↓
Frontend (React):
  WebSocket listener updates component state
    ↓
  Charts/KPIs animate/update in real-time
```

### Backend Tasks

**Task P1-1: Add Django Channels for WebSocket Support**
- Install: `channels` and `channels-redis`
- Configure: `ASGI_APPLICATION = 'config.asgi.application'`
- Create: WebSocket consumer at `kakebe_apps/analytics/consumers.py`
- Setup: Redis as channel layer for message passing
- Files:
  - Create: `kakebe_apps/analytics/consumers.py`
  - Modify: `config/settings.py` (add CHANNEL_LAYERS, ASGI)
  - Modify: `config/asgi.py` (route WebSocket)
  - Create: `kakebe_apps/analytics/routing.py`

**Task P1-2: Create Real-Time Metrics Calculation**
- Hook: Django signal listeners for Order/User/Merchant creation
- Function: Calculate metrics delta (today's new count vs total)
- Publish: To Redis channel `analytics:metrics:update`
- Files:
  - Modify: `kakebe_apps/analytics/signals.py` (new file)
  - Modify: `kakebe_apps/analytics/models.py` (add signal receivers)
  - Modify: `kakebe_apps/analytics/apps.py` (register signals)

**Task P1-3: WebSocket Endpoint for Live Metrics**
- Endpoint: `/ws/analytics/live/`
- Data Sent: Every order/user/merchant creation
  ```json
  {
    "type": "metrics_update",
    "data": {
      "total_orders": 450,
      "new_orders_today": 12,
      "total_users": 1250,
      "new_users_today": 3,
      "total_merchants": 45,
      "new_merchants_today": 1,
      "timestamp": "2026-04-30T15:32:00Z"
    }
  }
  ```
- Auth: JWT token in WebSocket handshake

### Frontend Tasks

**Task P1-4: WebSocket Hook for Real-Time Updates**
- Create: `dashboard/src/hooks/useAnalyticsLive.ts`
- Hook: `useAnalyticsLive()` connects to WebSocket
- Returns: Live metrics object + isConnected status
- Features:
  - Auto-reconnect on disconnect
  - Fallback to polling if WebSocket fails
  - Type-safe with TypeScript
- Files:
  - Create: `dashboard/src/hooks/useAnalyticsLive.ts`
  - Create: `dashboard/src/lib/websocket.ts` (WebSocket client)

**Task P1-5: Update Components for Live Updates**
- Modify: `DailyMetricsCards.tsx` to accept live metrics
- Add: Smooth number transitions/animations when values update
- Add: "Live" badge showing connection status
- Add: Pulse animation when new data arrives
- Files:
  - Modify: `dashboard/src/components/analytics/DailyMetricsCards.tsx`
  - Modify: `dashboard/src/components/analytics/AnalyticsDashboard.tsx`

**Task P1-6: Live Data Integration**
- Update: `AnalyticsDashboard.tsx` to merge live + daily data
- Logic: Use live for "today's count", daily snapshots for trends
- Priority: Real-time takes precedence when available
- Fallback: Show daily snapshot if WebSocket unavailable

### Deployment

- Requires: Redis server running
- Requires: Channels and Daphne ASGI server
- Docker: Add Channels, Redis to docker-compose
- Nginx: Configure upstream for WebSocket (`upgrade: websocket`)

### Testing

- Unit: WebSocket consumer tests
- Integration: Order creation → WebSocket broadcast → Frontend update
- Load: 100 concurrent WebSocket connections
- Fallback: Verify polling works if WebSocket unavailable

---

## Phase 2: Anomaly Detection & Alerts

### Problem Solved
Currently: No warning when metrics drop or spike  
Goal: Automatically detect and flag unusual patterns

### Algorithm

```
For each metric (orders, users, merchants):
  1. Calculate 7-day rolling average
  2. Calculate standard deviation
  3. If today > avg + (2 × stddev): Flag as SPIKE
  4. If today < avg - (2 × stddev): Flag as DROP
  5. Show alert with severity (🔴 Critical, 🟡 Warning, 🟢 Normal)
```

### Backend Tasks

**Task P2-1: Anomaly Detection in Snapshot Task**
- Modify: `kakebe_apps/analytics/tasks.py`
- Logic: When creating daily snapshot, calculate anomaly score
- Store: Anomaly data in new `DailyAnalyticsSnapshot` fields
  - `orders_anomaly_score` (float: -2 to +2 std devs)
  - `orders_is_anomaly` (bool)
  - `users_anomaly_score`
  - `users_is_anomaly`
  - `merchants_anomaly_score`
  - `merchants_is_anomaly`
- Database: Add 6 new fields to `DailyAnalyticsSnapshot`
- Files:
  - Modify: `kakebe_apps/analytics/models.py` (add fields)
  - Create: `kakebe_apps/analytics/migration/0002_add_anomaly_fields.py`
  - Modify: `kakebe_apps/analytics/tasks.py` (add detection)

**Task P2-2: Anomaly API Endpoint**
- New Endpoint: `GET /api/v1/admin/analytics/anomalies/`
- Query Params: `?days=7` (lookback period)
- Response:
  ```json
  {
    "current_date": "2026-04-30",
    "anomalies": [
      {
        "metric": "orders",
        "expected": 80,
        "actual": 120,
        "deviation": "+50%",
        "severity": "warning",
        "message": "Orders 50% above average"
      }
    ]
  }
  ```
- Returns: Only anomalies (if none, empty array)

**Task P2-3: Alert Notification System**
- Trigger: If anomaly detected, create Alert record
- Model: `AnalyticsAlert` (metric, severity, date, is_read)
- Store: Last 30 days of alerts
- Broadcast: To WebSocket subscribers (see Phase 1)
- Files:
  - Create: `kakebe_apps/analytics/models.py` (add AnalyticsAlert)
  - Create: `kakebe_apps/analytics/serializers.py` (add AlertSerializer)
  - Create: `kakebe_apps/analytics/views.py` (add alerts endpoint)

### Frontend Tasks

**Task P2-4: Anomaly Display Component**
- Create: `dashboard/src/components/analytics/AnomalyAlert.tsx`
- Shows: Banner with red/yellow/green severity indicator
- Content: "Orders up 50% (120 vs 80 avg) — check for bugs or campaigns!"
- CTA: Click to drill down and investigate (see Phase 3)
- Features:
  - Dismissible (remember dismissal for 24h)
  - Sortable by severity
  - Expandable for details
- Files:
  - Create: `dashboard/src/components/analytics/AnomalyAlert.tsx`

**Task P2-5: Hook for Anomalies**
- Create: `dashboard/src/hooks/useAnomalies.ts`
- Endpoint: GET `/api/v1/admin/analytics/anomalies/?days=7`
- Returns: Array of anomaly objects
- Polling: Refresh every 5 minutes (or via WebSocket in Phase 1)
- Files:
  - Create: `dashboard/src/hooks/useAnomalies.ts`
  - Modify: `dashboard/src/api/analytics.ts` (add fetchAnomalies)

**Task P2-6: Alert Integration**
- Modify: `AnalyticsDashboard.tsx` to show anomaly banner at top
- Logic: Only show if anomalies exist
- Interaction: Click → scroll to relevant metric or drill down
- Files:
  - Modify: `dashboard/src/components/analytics/AnalyticsDashboard.tsx`

### Testing

- Unit: Anomaly detection algorithm (edge cases: all zeros, perfect average)
- Integration: Snapshot creation → Anomaly detection → API response
- Manual: Create unusual data, verify alerts trigger
- Verification: False positive rate < 5%

---

## Phase 3: Drill-Down & Click-Through Details

### Problem Solved
Currently: See "45 Orders" but can't see which orders  
Goal: Click metric → see actual data, filters, export options

### User Flow

```
Dashboard Card "Orders: 45" (with ↑+5 trend)
    ↓ [Click]
Modal/Detail Page Opens:
    ├─ Filter: By Status (NEW, COMPLETED, CANCELLED)
    ├─ Filter: By Date Range (Today, Yesterday, Last 7 days)
    ├─ Table: Order ID | Buyer | Merchant | Amount | Status | Time
    ├─ Search: "search orders..."
    ├─ Export: CSV, PDF
    └─ Actions: View Order Details, Contact Buyer/Merchant
```

### Backend Tasks

**Task P3-1: Detailed Metrics Endpoints**
- New Endpoints:
  - `GET /api/v1/admin/analytics/orders/summary/?date=2026-04-30` 
    → Count by status (NEW, COMPLETED, CANCELLED, CONFIRMED)
  - `GET /api/v1/admin/analytics/orders/list/?date=2026-04-30&page=1`
    → Paginated list of orders for date
  - `GET /api/v1/admin/analytics/users/summary/?date=2026-04-30`
    → New vs returning, by country, etc.
  - `GET /api/v1/admin/analytics/merchants/summary/?date=2026-04-30`
    → New vs verified, by category
- Query Params: `date`, `page`, `limit`, `search`, `filter_by`
- Response: Data + count + pagination info
- Files:
  - Modify: `kakebe_apps/analytics/views.py` (add detail endpoints)
  - Modify: `kakebe_apps/analytics/serializers.py` (add detail serializers)

**Task P3-2: Search & Filter Support**
- Support: Search by order ID, buyer name, merchant name
- Support: Filter by status, date range, price range
- Database: Use Django ORM `.filter()`, `.search()`
- Performance: Add database indexes on frequently filtered fields
- Files:
  - Modify: `kakebe_apps/analytics/views.py` (add filtering logic)
  - Create: `kakebe_apps/analytics/migrations/0003_add_indexes.py`

**Task P3-3: Export Functionality**
- Format: CSV, PDF
- Library: `django-rest-framework` + `reportlab` for PDF
- Fields: All order/user/merchant fields
- File Download: Return file in response with `Content-Disposition`
- Files:
  - Create: `kakebe_apps/analytics/utils.py` (export functions)
  - Modify: `kakebe_apps/analytics/views.py` (add export action)

### Frontend Tasks

**Task P3-4: Detail Modal Component**
- Create: `dashboard/src/components/analytics/DetailModal.tsx`
- Props: `metric` (orders|users|merchants), `date`, `isOpen`, `onClose`
- Sections:
  - Summary stats (total, by status/category)
  - Filters (date range, status, search)
  - Data table with pagination
  - Export buttons
- Features:
  - Loading state
  - Error handling
  - Responsive on mobile
- Files:
  - Create: `dashboard/src/components/analytics/DetailModal.tsx`

**Task P3-5: Make Metrics Clickable**
- Modify: `DailyMetricsCards.tsx` - add click handler
- Modify: `TrendCharts.tsx` - add click handler to chart points
- Modify: `MerchantPerformance.tsx` - click merchant → detail view
- State: Track which metric modal is open
- Files:
  - Modify: `dashboard/src/components/analytics/DailyMetricsCards.tsx`
  - Modify: `dashboard/src/components/analytics/TrendCharts.tsx`
  - Modify: `dashboard/src/components/analytics/MerchantPerformance.tsx`
  - Modify: `dashboard/src/components/analytics/AnalyticsDashboard.tsx` (manage modal state)

**Task P3-6: Detail Data Hook**
- Create: `dashboard/src/hooks/useMetricDetail.ts`
- Accepts: `metric` (orders|users|merchants), `date`, `filters`
- Returns: Detail data + loading state
- Caching: 5-minute stale time
- Files:
  - Create: `dashboard/src/hooks/useMetricDetail.ts`
  - Modify: `dashboard/src/api/analytics.ts` (add detail fetchers)

**Task P3-7: User Journey Integration**
- Links: From detail modal back to order/merchant pages
- Example: "View Order #123" → navigates to `/orders/123`
- Example: "View Merchant" → navigates to `/merchants/{id}`
- Files:
  - Modify: `dashboard/src/components/analytics/DetailModal.tsx` (add links)

### Testing

- Unit: Filter/search logic
- Integration: Click metric → Modal loads → Data displays
- E2E: Click orders card → Filter by COMPLETED → See filtered list → Export CSV
- Performance: Modal loads < 500ms
- Mobile: Modal responsive on 375px screens

---

## Implementation Timeline

### Sprint 1 (Week 1-2): Phase 2 - Anomaly Detection ⚡ **START HERE**
- Fastest ROI, lowest complexity
- 40 hours total
- Gives you automatic alerts immediately
- Tasks: P2-1 through P2-6

### Sprint 2 (Week 3-4): Phase 3 - Drill-Down
- High value, medium complexity
- 50 hours total
- Makes metrics actionable
- Tasks: P3-1 through P3-7

### Sprint 3 (Week 5): Phase 1 - Real-Time WebSocket
- Nice to have, medium complexity
- 35 hours total
- Makes dashboard "live"
- Tasks: P1-1 through P1-6

---

## Effort Estimates

| Phase | Duration | Difficulty | ROI |
|-------|----------|-----------|-----|
| **Phase 2: Anomalies** | 1-2 weeks | Low | 🔥🔥🔥 Highest |
| **Phase 3: Drill-Down** | 2-3 weeks | Medium | 🔥🔥 High |
| **Phase 1: Real-Time** | 1-2 weeks | Medium | 🔥 Medium |
| **Total** | 4-7 weeks | — | — |

---

## Success Criteria

### Phase 1: Real-Time
- ✅ WebSocket connects without errors
- ✅ Metrics update within 2 seconds of order creation
- ✅ Handles 100+ concurrent connections
- ✅ Graceful fallback to polling

### Phase 2: Anomalies
- ✅ Alerts trigger correctly (test with synthetic data)
- ✅ < 5% false positive rate
- ✅ Alerts visible in dashboard banner
- ✅ Users can dismiss and re-enable

### Phase 3: Drill-Down
- ✅ Click metric opens modal
- ✅ Filter/search returns correct results
- ✅ Export CSV contains all data
- ✅ Links navigate to detail pages correctly

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| WebSocket connection drops | Implement auto-reconnect + fallback to polling |
| Anomaly detection too noisy | Tune thresholds (2-3 sigma, not 1-2) |
| Performance on drill-down (large tables) | Paginate, lazy-load, add indexes |
| Backwards compatibility | Ensure old snapshot logic still works |
| Mobile responsiveness | Test modals on 375px screens early |

---

## Dependencies

- **Channels**: `pip install channels channels-redis`
- **Daphne**: `pip install daphne` (ASGI server)
- **Redis**: Docker container or external service
- **ReportLab** (optional): `pip install reportlab` for PDF exports

---

## Git Strategy

- Create feature branch: `feature/analytics-enhancements`
- One commit per task (P1-1, P1-2, etc.)
- PR review before merging each phase
- Tag releases: `v1.1.0` (Phase 1), `v1.2.0` (Phase 2), `v1.3.0` (Phase 3)

---

## Deployment Checklist

- [ ] Backup production database
- [ ] Run migrations on staging
- [ ] Test WebSocket/anomalies on staging
- [ ] Update nginx WebSocket config
- [ ] Update docker-compose with Redis/Channels
- [ ] Monitor error logs for first 24h post-deployment
- [ ] Gradual rollout to 25% → 50% → 100% traffic (if using feature flags)

---

## Future Enhancements (Out of Scope)

- AI-powered forecasting ("You'll hit 1000 orders by Friday")
- Cohort analysis (user retention curves)
- Attribution modeling (what drives conversions)
- Custom dashboard builder (users create own views)
- Scheduled reports (email analytics every Monday)
- Slack/Email alerts (notify when anomalies detected)

---

## Notes

**Recommended Approach:**
1. Start with **Phase 2 (Anomalies)** — lowest effort, highest immediate value
2. Then **Phase 3 (Drill-Down)** — makes dashboard operationally useful
3. Finally **Phase 1 (Real-Time)** — polish layer

By Week 6, you'll have a dashboard that's not just pretty, but **genuinely useful for running the business**.

