/**
 * Status constants and utilities
 */
import {
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  FileTextIcon
} from 'lucide-react'

export const STATUS_CONFIG = {
  active: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon,
    label: 'Active'
  },
  completed: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircleIcon,
    label: 'Completed'
  },
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: ClockIcon,
    label: 'Pending'
  },
  draft: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: FileTextIcon,
    label: 'Draft'
  },
  cancelled: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircleIcon,
    label: 'Cancelled'
  },
  expired: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircleIcon,
    label: 'Expired'
  }
} as const

export type ContractStatus = keyof typeof STATUS_CONFIG

export const getStatusConfig = (status?: string | null) => {
  const normalizedStatus = status?.toLowerCase() as ContractStatus
  return STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.draft
}
