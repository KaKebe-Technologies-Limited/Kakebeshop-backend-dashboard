import { useEffect, useRef } from 'react'
import { websocketService, useWebSocketConnection } from '@/services/websocketService'
import { useAuthStore } from '@/stores/authStore'
import { useQueryClient } from '@tanstack/react-query'

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const hasConnected = useRef(false)

  // Connect to WebSocket when authenticated
  useWebSocketConnection()

  // Listen for real-time events
  useEffect(() => {
    if (!isAuthenticated) return

    // Listen for new orders
    const unsubscribeNewOrder = websocketService.on('new_order', (data) => {
      console.log('New order received:', data)
      
      // Invalidate orders cache
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order', {
          body: `Order ${data.order_number} has been placed`,
          icon: '/kakebe-shop.png'
        })
      }
    })

    // Listen for order status changes
    const unsubscribeOrderStatus = websocketService.on('order_status_changed', (data) => {
      console.log('Order status changed:', data)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', data.id] })
    })

    // Listen for new registrations
    const unsubscribeNewRegistration = websocketService.on('new_registration', (data) => {
      console.log('New registration received:', data)
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
    })

    // Listen for registration approvals
    const unsubscribeRegistrationApproved = websocketService.on('registration_approved', (data) => {
      console.log('Registration approved:', data)
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
    })

    // Listen for visitor count changes
    const unsubscribeVisitorCount = websocketService.on('visitor_count_changed', () => {
      queryClient.invalidateQueries({ queryKey: ['visitorAnalytics'] })
      queryClient.invalidateQueries({ queryKey: ['realtimeVisitors'] })
    })

    // Listen for notifications
    const unsubscribeNotification = websocketService.on('notification', (data) => {
      console.log('Notification received:', data)
      // Could integrate with in-app notification system
    })

    return () => {
      unsubscribeNewOrder()
      unsubscribeOrderStatus()
      unsubscribeNewRegistration()
      unsubscribeRegistrationApproved()
      unsubscribeVisitorCount()
      unsubscribeNotification()
    }
  }, [isAuthenticated, queryClient])

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default' && !hasConnected.current) {
      hasConnected.current = true
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission)
      })
    }
  }, [])

  return <>{children}</>
}

// Real-time badge component
import { Badge } from '@/components/ui/badge'
import { Circle } from 'lucide-react'

export function RealtimeIndicator() {
  const isConnected = websocketService.isConnected()

  return (
    <Badge variant={isConnected ? 'success' : 'secondary'} className="text-xs">
      <Circle className={`h-2 w-2 mr-1 ${isConnected ? 'fill-current' : ''}`} />
      {isConnected ? 'Live' : 'Offline'}
    </Badge>
  )
}
