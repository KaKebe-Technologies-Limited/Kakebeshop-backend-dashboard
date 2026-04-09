import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUGX(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'
  return 'UGX ' + num.toLocaleString('en-UG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function formatPriceRange(
  priceType: 'FIXED' | 'RANGE',
  price: string | null,
  priceMin: string | null,
  priceMax: string | null
): string {
  if (priceType === 'FIXED') return formatUGX(price)
  if (priceMin && priceMax) return `${formatUGX(priceMin)} – ${formatUGX(priceMax)}`
  if (priceMin) return `From ${formatUGX(priceMin)}`
  if (priceMax) return `Up to ${formatUGX(priceMax)}`
  return '—'
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

/** Returns `url` if it is a safe relative path (starts with `/` but not `//` or `/\`), otherwise returns `/`. */
export function isSafeRedirect(url: string | null | undefined): string {
  if (!url) return '/'
  if (url === '/') return '/'
  if (/^\/[^/\\]/.test(url)) return url
  return '/'
}
