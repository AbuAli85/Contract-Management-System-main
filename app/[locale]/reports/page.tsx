import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { ReportsPageContent } from "@/components/reports/ReportsPageContent"

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="premium">
      <ReportsPageContent />
    </ProtectedRoute>
  )
}
