// This is a test page to render the form.
// You can navigate to /promoters/profile-test to see the form.
// In a real app, this form would be part of /promoters/new or /promoters/[id]/edit pages.
"use client"

import PromoterProfileForm from "@/components/promoter-profile-form"
import type { PromoterProfile } from "@/lib/types"
import { devLog } from "@/lib/dev-log"
// Direct path string avoids build-time file reads that can fail
const placeholderSvg = "/placeholder.svg"

// Sample data for editing (optional)
const samplePromoterToEdit: PromoterProfile = {
  id: "promo-123",
  name_en: "Jane Smith",
  name_ar: "جين سميث",
  id_card_number: "9876543210",
  employer_id: "beta_workforce",
  outsourced_to_id: "client_tech_innovators",
  job_title: "Senior Promoter",
  work_location: "Tech Park, Building A",
  status: "active",
  contract_valid_until: "31-12-2025",
  // Use simple placeholder images without query parameters
  id_card_url: placeholderSvg,
  passport_url: placeholderSvg,
  id_card_expiry_date: "16-05-2026",
  passport_expiry_date: "20-03-2028",
  notes: "Excellent performance. Key contact for Tech Innovators project.",
  created_at: "2023-01-10T10:00:00Z",
}

export default function PromoterProfileTestPage() {
  const handleFormSubmit = (data: any) => {
    devLog("Form submitted on test page:", data)
    // You can add navigation or other actions here
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <PromoterProfileForm
        // promoterToEdit={samplePromoterToEdit} // Uncomment to test edit mode
        onFormSubmitSuccess={handleFormSubmit}
      />
    </div>
  )
}
