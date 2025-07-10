import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react"

/**
 * Get status icon based on overall status
 */
export const getStatusIcon = (status: string) => {
  switch (status) {
    case "active": return <CheckCircle className="h-4 w-4 text-green-500" />
    case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case "critical": return <XCircle className="h-4 w-4 text-red-500" />
    default: return <Clock className="h-4 w-4 text-gray-500" />
  }
}

/**
 * Get badge variant based on status
 */
export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "active": return "default"
    case "warning": return "secondary" 
    case "critical": return "destructive"
    default: return "outline"
  }
}

/**
 * Status color mapping for consistent styling
 */
export const STATUS_COLORS = {
  active: {
    bg: "bg-green-50 dark:bg-green-950",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-500",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950", 
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-500",
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-950",
    text: "text-red-700 dark:text-red-300", 
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-500",
  },
  inactive: {
    bg: "bg-gray-50 dark:bg-gray-950",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-800", 
    icon: "text-gray-500",
  },
} as const

/**
 * Document status color mapping
 */
export const DOCUMENT_STATUS_COLORS = {
  valid: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-800 dark:text-green-200",
    icon: "text-green-600",
  },
  expiring: {
    bg: "bg-amber-100 dark:bg-amber-900", 
    text: "text-amber-800 dark:text-amber-200",
    icon: "text-amber-600",
  },
  expired: {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-800 dark:text-red-200",
    icon: "text-red-600", 
  },
  missing: {
    bg: "bg-gray-100 dark:bg-gray-900",
    text: "text-gray-800 dark:text-gray-200",
    icon: "text-gray-600",
  },
} as const

/**
 * Priority levels for sorting/filtering
 */
export const STATUS_PRIORITY = {
  critical: 4,
  warning: 3, 
  active: 2,
  inactive: 1,
} as const

/**
 * Get priority score for status (higher = more urgent)
 */
export const getStatusPriority = (status: string): number => {
  return STATUS_PRIORITY[status as keyof typeof STATUS_PRIORITY] || 0
}

/**
 * Get status color classes
 */
export const getStatusColors = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.inactive
}

/**
 * Get document status color classes
 */
export const getDocumentStatusColors = (status: string) => {
  return DOCUMENT_STATUS_COLORS[status as keyof typeof DOCUMENT_STATUS_COLORS] || DOCUMENT_STATUS_COLORS.missing
}
