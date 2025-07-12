import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AdminPageContent } from "@/components/admin/AdminPageContent"

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminPageContent />
    </ProtectedRoute>
  )
}
