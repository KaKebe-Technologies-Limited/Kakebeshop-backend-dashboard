// Multi-channel notification service
// Supports: ntfy, email, SMS, in-app notifications

export type NotificationChannel = 'ntfy' | 'email' | 'sms' | 'in_app'
export type NotificationPriority = 'max' | 'high' | 'default' | 'low' | 'min'

export interface NotificationPayload {
  channel: NotificationChannel[]
  title: string
  message: string
  priority?: NotificationPriority
  tags?: string[]
  recipient?: {
    email?: string
    phone?: string
    userId?: string
  }
  metadata?: Record<string, any>
}

export interface NotificationResult {
  channel: NotificationChannel
  success: boolean
  messageId?: string
  error?: string
}

// Email notification service
class EmailService {
  private apiKey: string
  private fromEmail: string

  constructor() {
    this.apiKey = import.meta.env.VITE_EMAIL_API_KEY || ''
    this.fromEmail = import.meta.env.VITE_EMAIL_FROM || 'noreply@kakebe.shop'
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('Email API key not configured')
      return false
    }

    try {
      // Example using a generic email API (e.g., SendGrid, Resend, etc.)
      // Replace with your preferred email service
      const response = await fetch('/api/v1/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          to,
          from: this.fromEmail,
          subject,
          html
        })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  formatOrderNotification(type: string, data: Record<string, any>): { subject: string; html: string } {
    const subject = `[Kakebe Shop] ${type}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">${type}</h1>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
          ${Object.entries(data).map(([key, value]) => `
            <p style="margin: 8px 0;">
              <strong>${key}:</strong> ${value}
            </p>
          `).join('')}
        </div>
        <p style="color: #6b7280; margin-top: 20px;">
          This is an automated notification from Kakebe Shop.
        </p>
      </div>
    `
    return { subject, html }
  }
}

// SMS notification service
class SMSService {
  private apiKey: string
  private fromPhone: string

  constructor() {
    this.apiKey = import.meta.env.VITE_SMS_API_KEY || ''
    this.fromPhone = import.meta.env.VITE_SMS_FROM || ''
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    if (!this.apiKey || !this.fromPhone) {
      console.warn('SMS API not configured')
      return false
    }

    try {
      // Example using a generic SMS API
      const response = await fetch('/api/v1/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          to: phone,
          from: this.fromPhone,
          message
        })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to send SMS:', error)
      return false
    }
  }

  truncateMessage(message: string, maxLength: number = 160): string {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength - 3) + '...'
  }
}

// In-app notification service
class InAppNotificationService {
  async sendToUser(userId: string, title: string, message: string, metadata?: Record<string, any>): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/notifications/in-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          notification_type: 'SYSTEM',
          title,
          message,
          metadata: metadata || {}
        })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to send in-app notification:', error)
      return false
    }
  }
}

// Main notification service
class NotificationService {
  private email: EmailService
  private sms: SMSService
  private inApp: InAppNotificationService

  constructor() {
    this.email = new EmailService()
    this.sms = new SMSService()
    this.inApp = new InAppNotificationService()
  }

  async send(payload: NotificationPayload): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []

    for (const channel of payload.channel) {
      try {
        switch (channel) {
          case 'ntfy':
            results.push(await this.sendNtfy(payload))
            break
          case 'email':
            results.push(await this.sendEmailNotification(payload))
            break
          case 'sms':
            results.push(await this.sendSMSNotification(payload))
            break
          case 'in_app':
            results.push(await this.sendInAppNotification(payload))
            break
        }
      } catch (error) {
        results.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  private async sendNtfy(payload: NotificationPayload): Promise<NotificationResult> {
    const NTFY_URL = import.meta.env.VITE_NTFY_URL || 'https://ntfy.sh'
    const NTFY_TOPIC = import.meta.env.VITE_NTFY_TOPIC || 'kakebe-notifications'

    try {
      await fetch(`${NTFY_URL}/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': payload.title || 'Kakebe Notification',
          'Tags': payload.tags?.join(',') || '',
          'Priority': payload.priority || 'default',
          'Content-Type': 'text/plain'
        },
        body: payload.message
      })

      return { channel: 'ntfy', success: true }
    } catch (error) {
      return {
        channel: 'ntfy',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send ntfy notification'
      }
    }
  }

  private async sendEmailNotification(payload: NotificationPayload): Promise<NotificationResult> {
    if (!payload.recipient?.email) {
      return { channel: 'email', success: false, error: 'No email recipient specified' }
    }

    const { subject, html } = this.email.formatOrderNotification(payload.title, {
      Message: payload.message,
      ...payload.metadata
    })

    const success = await this.email.sendEmail(payload.recipient.email, subject, html)

    return { channel: 'email', success }
  }

  private async sendSMSNotification(payload: NotificationPayload): Promise<NotificationResult> {
    if (!payload.recipient?.phone) {
      return { channel: 'sms', success: false, error: 'No phone recipient specified' }
    }

    const message = this.sms.truncateMessage(`${payload.title}: ${payload.message}`)
    const success = await this.sms.sendSMS(payload.recipient.phone, message)

    return { channel: 'sms', success }
  }

  private async sendInAppNotification(payload: NotificationPayload): Promise<NotificationResult> {
    if (!payload.recipient?.userId) {
      return { channel: 'in_app', success: false, error: 'No user ID specified' }
    }

    const success = await this.inApp.sendToUser(
      payload.recipient.userId,
      payload.title,
      payload.message,
      payload.metadata
    )

    return { channel: 'in_app', success }
  }

  // Convenience methods for common notifications
  async notifyOrderCreated(orderData: {
    buyerEmail?: string
    buyerPhone?: string
    buyerId?: string
    orderNumber: string
    total: string
    items: number
  }): Promise<NotificationResult[]> {
    const message = `Order ${orderData.orderNumber} created with ${orderData.items} item(s) totaling ${orderData.total}`
    
    return this.send({
      channel: ['ntfy', 'email', 'in_app'],
      title: 'New Order Created',
      message,
      priority: 'high',
      tags: ['shopping_cart', 'bell'],
      recipient: {
        email: orderData.buyerEmail,
        userId: orderData.buyerId
      },
      metadata: orderData
    })
  }

  async notifyRegistrationApproved(userData: {
    email: string
    username: string
    userId?: string
  }): Promise<NotificationResult[]> {
    return this.send({
      channel: ['email', 'in_app'],
      title: 'Registration Approved',
      message: `Welcome to Kakebe Shop, ${userData.username}! Your account has been approved.`,
      priority: 'default',
      tags: ['bust_in_silhouette', 'tada'],
      recipient: {
        email: userData.email,
        userId: userData.userId
      },
      metadata: userData
    })
  }

  async notifyOrderStatusChanged(orderData: {
    buyerEmail?: string
    buyerId?: string
    orderNumber: string
    oldStatus: string
    newStatus: string
  }): Promise<NotificationResult[]> {
    return this.send({
      channel: ['email', 'in_app'],
      title: 'Order Status Updated',
      message: `Your order ${orderData.orderNumber} status has changed from ${orderData.oldStatus} to ${orderData.newStatus}`,
      priority: 'default',
      tags: ['package'],
      recipient: {
        email: orderData.buyerEmail,
        userId: orderData.buyerId
      },
      metadata: orderData
    })
  }
}

export const notificationService = new NotificationService()
