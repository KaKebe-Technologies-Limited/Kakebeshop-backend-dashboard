const NTFY_URL = import.meta.env.VITE_NTFY_URL || 'https://ntfy.sh'
const NTFY_TOPIC = import.meta.env.VITE_NTFY_TOPIC || 'Kakebe-Shop-orders'

interface NotifyOptions {
  title?: string
  tags?: string[]
  priority?: 'max' | 'high' | 'default' | 'low' | 'min'
  userAgent?: string
}

const BOT_USER_AGENTS = [
  /bot/i, /spider/i, /crawl/i, /slurp/i, /mediapartners/i,
  /googlebot/i, /bingbot/i, /yandex/i, /baidu/i, /duckduckbot/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i, /whatsapp/i,
  /applebot/i, /outlook/i, /semrush/i, /ahrefs/i, /mj12bot/i,
  /yahoo/i, /curl/i, /wget/i, /python-requests/i
]

export const ntfyService = {
  async notifyPageView(pageUrl: string, userAgent: string): Promise<void> {
    await this.sendNotification({
      title: 'Page View',
      tags: ['eye'],
      priority: 'low',
      userAgent,
    }, `Page: ${pageUrl}\nUser-Agent: ${userAgent.substring(0, 50)}`)
  },

  async notifyProductViewed(productTitle: string, pageUrl: string, userAgent: string): Promise<void> {
    await this.sendNotification({
      title: 'Product Viewed',
      tags: ['shopping_cart'],
      priority: 'default',
      userAgent,
    }, `Product: ${productTitle}\nPage: ${pageUrl}\nUser-Agent: ${userAgent.substring(0, 50)}`)
  },

  async notifyOrderPlaced(orderType: string, total: string, buyer: string, userAgent: string): Promise<void> {
    await this.sendNotification({
      title: 'New Order Placed',
      tags: ['shopping_cart', 'bell'],
      priority: 'high',
      userAgent,
    }, `Order Type: ${orderType}\nTotal: ${total}\nBuyer: ${buyer}`)
  },

  async notifyUserRegistered(userIdentifier: string, source: string, userAgent: string): Promise<void> {
    await this.sendNotification({
      title: 'New Account Created',
      tags: ['bust_in_silhouette', 'tada'],
      priority: 'default',
      userAgent,
    }, `User: ${userIdentifier}\nSource: ${source}`)
  },

  isBot(userAgent: string): boolean {
    return BOT_USER_AGENTS.some(pattern => pattern.test(userAgent))
  },

  async sendNotification(options: NotifyOptions, message: string): Promise<void> {
    if (options.userAgent && this.isBot(options.userAgent)) {
      return
    }

    try {
      await fetch(`${NTFY_URL}/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': options.title || 'Kakebe Notification',
          'Tags': options.tags?.join(',') || '',
          'Priority': options.priority || 'default',
          'Content-Type': 'text/plain'
        },
        body: message
      })
    } catch (error) {
      console.error('Failed to send ntfy notification:', error)
    }
  }
}
