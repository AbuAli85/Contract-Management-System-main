import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { PartiesPageContent } from "@/components/parties/PartiesPageContent"

export default function PartiesPage() {
  return (
    <ProtectedRoute>
      <PartiesPageContent />
    </ProtectedRoute>
  )
}
