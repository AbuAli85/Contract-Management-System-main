import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, XCircle, AlertTriangle, FileText, Archive, Send, Eye } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface ContractStatus {
  value: string
  label: string
  description: string
  color: string
  icon: React.ComponentType<{ className?: string }>
  priority: number
}

export const CONTRACT_STATUSES: ContractStatus[] = [
  {
    value: "draft",
    label: "Draft",
    description: "Contract is being prepared",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: FileText,
    priority: 1
  },
  {
    value: "pending_review",
    label: "Pending Review",
    description: "Awaiting review and approval",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    priority: 2
  },
  {
    value: "active",
    label: "Active",
    description: "Contract is currently active",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
    priority: 3
  },
  {
    value: "expired",
    label: "Expired",
    description: "Contract has expired",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    priority: 4
  },
  {
    value: "terminated",
    label: "Terminated",
    description: "Contract was terminated early",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    priority: 5
  },
  {
    value: "suspended",
    label: "Suspended",
    description: "Contract is temporarily suspended",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
    priority: 6
  },
  {
    value: "archived",
    label: "Archived",
    description: "Contract has been archived",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: Archive,
    priority: 7
  },
  {
    value: "unknown",
    label: "Unknown",
    description: "Status is not determined",
    color: "bg-gray-100 text-gray-500 border-gray-200",
    icon: AlertTriangle,
    priority: 8
  }
]

export function getContractStatus(status: string): ContractStatus {
  return CONTRACT_STATUSES.find(s => s.value === status) || CONTRACT_STATUSES.find(s => s.value === "unknown")!
}

export function EnhancedStatusBadge({ 
  status, 
  showIcon = true, 
  showTooltip = true,
  size = "default"
}: { 
  status: string
  showIcon?: boolean
  showTooltip?: boolean
  size?: "sm" | "default" | "lg"
}) {
  const statusConfig = getContractStatus(status)
  const Icon = statusConfig.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    default: "text-sm px-2.5 py-1.5",
    lg: "text-base px-3 py-2"
  }

  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        statusConfig.color,
        sizeClasses[size],
        "font-medium inline-flex items-center gap-1.5"
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {statusConfig.label}
    </Badge>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{statusConfig.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}

export function StatusFilter({ 
  currentStatus, 
  onStatusChange 
}: { 
  currentStatus: string
  onStatusChange: (status: string) => void 
}) {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onStatusChange(e.target.value)}
      className="border rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">All Statuses</option>
      {CONTRACT_STATUSES.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  )
}
