import { z } from "zod"

export const partyFormSchema = z.object({
  name_en: z.string().min(2, { message: "English name must be at least 2 characters." }),
  name_ar: z.string().optional(),
  crn: z.string().optional(),
  type: z.enum(["Employer", "Client"]),
  role: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Suspended"]),
  cr_expiry_date: z.date().optional(),
  tax_number: z.string().optional(),
  license_number: z.string().optional(),
  license_expiry_date: z.date().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z
    .string()
    .email({ message: "Invalid email address." })
    .optional()
    .or(z.literal("")),
  address_en: z.string().optional(),
  address_ar: z.string().optional(),
  notes: z.string().optional(),
})

export type PartyFormData = z.infer<typeof partyFormSchema>
