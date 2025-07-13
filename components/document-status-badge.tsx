import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DocumentStatusBadgeProps {
  status: string | null | undefined
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  if (!status) {
    return <Badge variant="secondary">N/A</Badge>
  }

  const normalizedStatus = status.toLowerCase()

  let variant: "default" | "secondary" | "destructive" | "outline" | null | undefined = "secondary"
  let text = status

  switch (normalizedStatus) {
    case "draft":
      variant = "outline"
      text = "Draft"
      break
    case "pending_review":
      variant = "secondary"
      text = "Pending Review"
      break
    case "approved":
      variant = "default"
      text = "Approved"
      break
    case "rejected":
      variant = "destructive"
      text = "Rejected"
      break
    case "signed":
      variant = "default"
      text = "Signed"
      break
    case "archived":
      variant = "outline"
      text = "Archived"
      break
    default:
      variant = "secondary"
      text = status
  }

  return (
    <Badge
      className={cn(
        "px-2 py-1 text-xs font-medium",
        normalizedStatus === "approved" && "bg-green-100 text-green-800 hover:bg-green-100/80",
        normalizedStatus === "signed" && "bg-blue-100 text-blue-800 hover:bg-blue-100/80",
        normalizedStatus === "pending_review" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
        normalizedStatus === "rejected" && "bg-red-100 text-red-800 hover:bg-red-100/80",
        normalizedStatus === "draft" && "bg-gray-100 text-gray-800 hover:bg-gray-100/80",
        normalizedStatus === "archived" && "bg-purple-100 text-purple-800 hover:bg-purple-100/80",
      )}
      variant={variant}
    >
      {text}
    </Badge>
  )
}
