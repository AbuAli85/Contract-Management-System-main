import { z } from "zod"
import type { Database } from "./supabase" // Import from generated types

// Re-export main types for convenience
export type Party = Database["public"]["Tables"]["parties"]["Row"]
export type Promoter = Database["public"]["Tables"]["promoters"]["Row"] & {
  name_en?: string
}
export type Contract = Database["public"]["Tables"]["contracts"]["Row"]

// Example Zod schema for a form (can be moved to a lib/validations folder)
export const promoterFormSchema = z.object({
  name_en: z.string().min(2, "English name is required."),
  name_ar: z.string().min(2, "Arabic name is required."),
  id_card_number: z.string().min(5, "ID card number is required."),
  // Add other promoter fields as necessary, e.g., status, employer_id, etc.
  // For example:
  // status: z.enum(["active", "inactive", "pending_review"]),
  // employer_id: z.string().uuid().nullable(),
  id_card_url: z.string().url().optional().nullable(),
  passport_url: z.string().url().optional().nullable(),
  // ... any other fields from your PromoterFormData
})

export type PromoterFormData = z.infer<typeof promoterFormSchema>

export const promoterStatusesList = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending_review", label: "Pending Review" },
  // Add other statuses if needed
]
