import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ContractStatusIndicatorProps {
  status: string
}

export function ContractStatusIndicator({ status }: ContractStatusIndicatorProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "generating":
      case "pending":
        return {
          variant: "secondary" as const,
          icon: Clock,
          label: "Generating",
        }
      case "completed":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          label: "Completed",
        }
      case "failed":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          label: "Failed",
        }
      default:
        return {
          variant: "outline" as const,
          icon: AlertCircle,
          label: status,
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
