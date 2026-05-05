import type { UserEngagement } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MdPersonAdd, MdTrendingUp } from 'react-icons/md'

interface UserEngagementProps {
  data: UserEngagement | null
  period: 'daily' | 'weekly'
  isLoading: boolean
}

export function UserEngagementCard({ data, period, isLoading }: UserEngagementProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return <p className="text-muted-foreground text-sm">No user engagement data</p>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MdPersonAdd className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm">New Users</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">{data.new_users}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {period === 'daily' ? 'Registered today' : 'Registered this week'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-purple-500/5 border-purple-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MdTrendingUp className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-sm">Active Users</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-purple-600">{data.active_users}</p>
          <p className="text-xs text-muted-foreground mt-1">Logged in last 7 days</p>
        </CardContent>
      </Card>
    </div>
  )
}
