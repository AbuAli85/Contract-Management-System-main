import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface KeyMetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  colorClass: string
  className?: string
}

export function KeyMetricCard({ 
  title, 
  value, 
  icon: Icon, 
  colorClass,
  className = ''
}: KeyMetricCardProps) {
  return (
    <Card className={`${colorClass} shadow-lg ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="h-12 w-12 bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
