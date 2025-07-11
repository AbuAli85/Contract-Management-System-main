import type React from "react"
import { format, parseISO, differenceInDays, isPast } from "date-fns"
import { AlertTriangleIcon, ShieldCheckIcon, ShieldAlertIcon } from "lucide-react"

export type DocumentStatus = "valid" | "expiring_soon" | "expired" | "missing"

export interface DocumentStatusInfo {
  status: DocumentStatus
  text: string
  Icon: React.ElementType
  colorClass: string
  tooltip?: string
}

export const getDocumentStatus = (expiryDate: string | null | undefined): DocumentStatusInfo => {
  if (!expiryDate) {
    return {
      status: "missing",
      text: "No Date",
      Icon: AlertTriangleIcon,
      colorClass: "text-slate-500",
      tooltip: "Expiry date not set",
    }
  }
  const date = parseISO(expiryDate)
  const today = new Date()
  const daysUntilExpiry = differenceInDays(date, today)

  if (isPast(date)) {
    return {
      status: "expired",
      text: "Expired",
      Icon: ShieldAlertIcon,
      colorClass: "text-red-500",
      tooltip: `Expired on ${format(date, "MMM d, yyyy")}`,
    }
  }
  if (daysUntilExpiry <= 30) {
    return {
      status: "expiring_soon",
      text: "Expires Soon",
      Icon: ShieldAlertIcon,
      colorClass: "text-orange-500",
      tooltip: `Expires in ${daysUntilExpiry} day(s) on ${format(date, "MMM d, yyyy")}`,
    }
  }
  return {
    status: "valid",
    text: "Valid",
    Icon: ShieldCheckIcon,
    colorClass: "text-green-500",
    tooltip: `Valid until ${format(date, "MMM d, yyyy")}`,
  }
}
