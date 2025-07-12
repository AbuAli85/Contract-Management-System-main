import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { PromotersPageContent } from "@/components/promoters/PromotersPageContent"

export default function PromotersPage() {
  return (
    <ProtectedRoute>
      <PromotersPageContent />
    </ProtectedRoute>
  )
}

fetch("/path/to/promoters_rows.csv")
  .then((response) => response.text())
  .then((csvString) => {
    const result = Papa.parse(csvString, { header: true })
    console.log(result.data)
  })
