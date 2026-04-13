// WebSocket service for real-time dashboard updates
import { useAuthStore } from '@/stores/authStore'

type WebSocketEvent = 
  | 'new_order'
  | 'order_status_changed'
  | 'new_registration'
  | 'registration_approved'
  | 'registration_rejected'
  | 'visitor_count_changed'
  | 'notification'
  | 'ping'

interface WebSocketMessage {
  event: WebSocketEvent
  data: any
  timestamp: string
}

type EventCallback = (data: any) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000 // Start with 1 second
  private listeners: Map<WebSocketEvent, Set<EventCallback>> = new Map()
  private isConnecting = false
  private shouldReconnect = true

  constructor() {
    // Initialize listeners map
    this.listeners = new Map()
  }

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection)
            resolve()
          }
        }, 100)
      })
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.getWebSocketUrl()
        const token = useAuthStore.getState().access
        
        if (!token) {
          console.warn('No auth token available for WebSocket connection')
          this.isConnecting = false
          reject(new Error('No auth token available'))
          return
        }

        this.ws = new WebSocket(`${wsUrl}?token=${token}`)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.reconnectDelay = 1000
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.isConnecting = false
          
          if (this.shouldReconnect && event.code !== 1000) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  disconnect() {
    this.shouldReconnect = false
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.listeners.clear()
  }

  on(event: WebSocketEvent, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  emit(event: WebSocketEvent, data: any): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot emit')
      return
    }

    const message: WebSocketMessage = {
      event,
      data,
      timestamp: new Date().toISOString()
    }

    this.ws.send(JSON.stringify(message))
  }

  private handleMessage(message: WebSocketMessage): void {
    if (message.event === 'ping') {
      // Respond to ping to keep connection alive
      this.emit('ping', { pong: true })
      return
    }

    const callbacks = this.listeners.get(message.event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message.data)
        } catch (error) {
          console.error(`Error in WebSocket listener for ${message.event}:`, error)
        }
      })
    }

    // Also emit a generic 'message' event for debugging
    const messageCallbacks = this.listeners.get('message' as WebSocketEvent)
    if (messageCallbacks) {
      messageCallbacks.forEach(callback => callback(message))
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max WebSocket reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(console.error)
    }, delay)
  }

  private getWebSocketUrl(): string {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const url = new URL(apiBaseUrl)
    
    // Convert http/https to ws/wss
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${url.host}/ws/dashboard`
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const websocketService = new WebSocketService()

// React hook for using WebSocket in components
import { useEffect, useCallback } from 'react'

export function useWebSocket(event: WebSocketEvent, callback: EventCallback, deps: any[] = []) {
  useEffect(() => {
    const unsubscribe = websocketService.on(event, callback)
    return unsubscribe
  }, [event, ...deps])
}

export function useWebSocketConnection() {
  const connect = useCallback(() => {
    websocketService.connect().catch(console.error)
  }, [])

  const disconnect = useCallback(() => {
    websocketService.disconnect()
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { connect, disconnect, isConnected: () => websocketService.isConnected() }
}
