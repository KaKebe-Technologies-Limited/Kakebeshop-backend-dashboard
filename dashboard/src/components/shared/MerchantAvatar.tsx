import { getInitials, cn } from '@/lib/utils'

interface MerchantAvatarProps {
  logo: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

const colors = [
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
]

function hashName(name: string) {
  return (name ?? '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

export function MerchantAvatar({ logo, name, size = 'md', className }: MerchantAvatarProps) {
  const safeName = name ?? ''
  const color = colors[hashName(safeName) % colors.length]

  if (logo) {
    return (
      <img
        src={logo}
        alt={safeName}
        className={cn('rounded-full object-cover flex-shrink-0', sizeMap[size], className)}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold flex-shrink-0', sizeMap[size], color, className)}>
      {getInitials(safeName)}
    </div>
  )
}
