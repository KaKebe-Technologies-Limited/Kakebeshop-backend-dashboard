import { useEffect, useCallback } from 'react'
import { trackVisitorActivity } from '@/api/visitorTracking'

export function useVisitorTracking() {
  // Generate or retrieve session ID
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('visitor_session_id')
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem('visitor_session_id', sessionId)
    }
    return sessionId
  }, [])

  // Track page view
  const trackPageView = useCallback(async (pageUrl?: string, pageTitle?: string) => {
    const sessionId = getSessionId()
    const pageView = {
      page_url: pageUrl || window.location.href,
      page_title: pageTitle || document.title,
      product_id: null,
      timestamp: new Date().toISOString()
    }
    try {
      await trackVisitorActivity(sessionId, pageView)
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }, [getSessionId])

  const trackProductView = useCallback(async (productId: string, productTitle: string) => {
    const sessionId = getSessionId()
    const pageView = {
      page_url: window.location.href,
      page_title: productTitle,
      product_id: productId,
      timestamp: new Date().toISOString()
    }
    try {
      await trackVisitorActivity(sessionId, pageView)
    } catch (error) {
      console.error('Failed to track product view:', error)
    }
  }, [getSessionId])

  // Auto-track page views on route changes
  useEffect(() => {
    trackPageView()
  }, [trackPageView])

  return {
    sessionId: getSessionId(),
    trackPageView,
    trackProductView
  }
}
