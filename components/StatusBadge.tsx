import { Badge } from '@/components/ui/badge'
import { getStatusConfig } from '@/constants/status'

interface StatusBadgeProps {
  status?: string | null
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge className={`${config.color} flex items-center gap-1 px-3 py-1 text-sm font-medium ${className}`}>
      <Icon className="h-4 w-4" />
      {status || 'Unknown'}
    </Badge>
  )
}
