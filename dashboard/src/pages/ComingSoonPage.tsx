import { Construction } from 'lucide-react'
import { useLocation } from 'react-router-dom'

interface ComingSoonPageProps {
  title?: string
  description?: string
}

export default function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  const { pathname } = useLocation()
  const name = title || pathname.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const desc = description || 'This section is coming soon.'

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="rounded-full bg-muted p-5">
        <Construction className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      </div>
    </div>
  )
}
