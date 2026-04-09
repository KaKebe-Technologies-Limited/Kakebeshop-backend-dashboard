const NTFY_TOPIC = 'kakebe-notifications'
const NTFY_URL = 'https://ntfy.sh'

interface NotifyOptions {
  title?: string
  tags?: string[]
  priority?: 'max' | 'high' | 'default' | 'low' | 'min'
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
      priority: 'low'
    }, `Page: ${pageUrl}\nUser-Agent: ${userAgent.substring(0, 50)}`)
  },

  async notifyProductViewed(productTitle: string, pageUrl: string, userAgent: string): Promise<void> {
    await this.sendNotification({
      title: 'Product Viewed',
      tags: ['shopping_cart'],
      priority: 'default'
    }, `Product: ${productTitle}\nPage: ${pageUrl}\nUser-Agent: ${userAgent.substring(0, 50)}`)
  },

  async notifyOrderPlaced(orderType: string, total: string, buyer: string): Promise<void> {
    await this.sendNotification({
      title: 'New Order Placed',
      tags: ['shopping_cart', 'bell'],
      priority: 'high'
    }, `Order Type: ${orderType}\nTotal: ${total}\nBuyer: ${buyer}`)
  },

  isBot(userAgent: string): boolean {
    return BOT_USER_AGENTS.some(pattern => pattern.test(userAgent))
  },

  async sendNotification(options: NotifyOptions, message: string): Promise<void> {
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
