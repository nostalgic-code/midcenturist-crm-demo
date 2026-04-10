import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatCardProps {
  label: string
  value: string | number
  iconDef: IconDefinition
  trend?: string
  trendUp?: boolean
}

export default function StatCard({ label, value, iconDef, trend, trendUp }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FontAwesomeIcon icon={iconDef} className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        {trend && (
          <div className="mt-4">
            <Badge variant={trendUp ? 'default' : 'secondary'} className="text-[10px]">
              {trend}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
