import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { PromotersPageContent } from "@/components/promoters/PromotersPageContent"

export default function PromotersPage() {
  return (
    <ProtectedRoute>
      <PromotersPageContent />
    </ProtectedRoute>
  )
}
