import * as z from "zod"

export const contractFormSchema = z.object({
  first_party_id: z.string()
    .min(1, "First party is required")
    .uuid("Invalid party selection"),
  
  second_party_id: z.string()
    .min(1, "Second party is required")
    .uuid("Invalid party selection"),
  
  promoter_id: z.string()
    .min(1, "Promoter is required")
    .uuid("Invalid promoter selection"),
  
  contract_start_date: z.date({
    required_error: "Start date is required",
    invalid_type_error: "Please enter a valid date"
  }).refine(date => date >= new Date(), {
    message: "Start date cannot be in the past"
  }),
  
  contract_end_date: z.date({
    required_error: "End date is required",
    invalid_type_error: "Please enter a valid date"
  }),
  
  contract_value: z.coerce.number()
    .min(0, "Contract value must be positive")
    .max(10000000, "Contract value exceeds maximum limit")
    .optional(),
  
  job_title: z.string()
    .max(100, "Job title is too long")
    .optional(),
  
  work_location: z.string()
    .max(200, "Work location is too long")
    .optional(),
}).refine(data => data.contract_end_date > data.contract_start_date, {
  message: "End date must be after start date",
  path: ["contract_end_date"]
}).refine(data => data.first_party_id !== data.second_party_id, {
  message: "First party and second party cannot be the same",
  path: ["second_party_id"]
})

// Field-specific validation helpers
export const validateContractDuration = (startDate: Date, endDate: Date) => {
  const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 1) return { valid: false, message: "Contract must be at least 1 day long" }
  if (diffInDays > 3650) return { valid: false, message: "Contract cannot exceed 10 years" }
  
  return { valid: true, message: "" }
}

export const validateBusinessRules = {
  maxContractValue: 10000000,
  minContractDuration: 1,
  maxContractDuration: 3650,
  allowedCurrencies: ['SAR', 'USD', 'EUR'],
  requiredFields: ['first_party_id', 'second_party_id', 'promoter_id', 'contract_start_date', 'contract_end_date']
}