import { z } from "zod"

// Enhanced contract generator schema with comprehensive validation
export const contractGeneratorSchema = z
  .object({
    // Required party IDs
    first_party_id: z.string().uuid("Please select Party A (Client)."),
    second_party_id: z.string().uuid("Please select Party B (Employer)."),
    promoter_id: z.string().uuid("Please select the promoter."),
    
    // Auto-filled party data (hidden fields)
    first_party_name_en: z.string().optional(),
    first_party_name_ar: z.string().optional(),
    first_party_crn: z.string().optional(),
    second_party_name_en: z.string().optional(),
    second_party_name_ar: z.string().optional(),
    second_party_crn: z.string().optional(),
    
    // Auto-filled promoter data (hidden fields)
    promoter_name_en: z.string().optional(),
    promoter_name_ar: z.string().optional(),
    id_card_number: z.string().optional(),
    promoter_id_card_url: z.string().optional(),
    promoter_passport_url: z.string().optional(),
    
    // Contract period with enhanced validation
    contract_start_date: z.date({ 
      required_error: "Contract start date is required.",
      invalid_type_error: "Please enter a valid start date."
    }),
    contract_end_date: z.date({ 
      required_error: "Contract end date is required.",
      invalid_type_error: "Please enter a valid end date."
    }),
    
    // Contact information
    email: z
      .string()
      .email("Please enter a valid email address for notifications.")
      .min(1, "Email is required for contract notifications.")
      .max(255, "Email address is too long."),
    
    // Required employment details
    job_title: z
      .string()
      .min(1, "Job title is required.")
      .max(100, "Job title is too long."),
    
    department: z
      .string()
      .min(1, "Department is required.")
      .max(100, "Department name is too long."),
    
    contract_type: z
      .string()
      .min(1, "Contract type is required.")
      .max(100, "Contract type is too long.")
      .refine((value) => {
        // Validate against known contract types
        const validTypes = [
          "unlimited-contract", "limited-contract", "part-time-contract",
          "full-time-permanent", "full-time-fixed", "part-time-permanent", "part-time-fixed",
          "probationary", "training-contract", "internship", "graduate-trainee",
          "project-based", "consulting", "freelance", "contractor",
          "seasonal", "temporary", "casual",
          "executive", "management", "director",
          "remote-work", "hybrid-work", "secondment", "apprenticeship",
          "service-agreement", "retainer", "other"
        ];
        return validTypes.includes(value);
      }, {
        message: "Please select a valid contract type from the available options."
      }),
    
    currency: z
      .string()
      .min(1, "Currency is required.")
      .max(10, "Currency code is too long."),
    
    work_location: z
      .string()
      .min(1, "Work location is required.")
      .max(200, "Work location is too long."),
    
    // Optional salary information (if provided, must be valid)
    basic_salary: z
      .number()
      .positive("Basic salary must be positive.")
      .max(1000000, "Basic salary seems too high. Please verify.")
      .optional(),
    
    allowances: z
      .number()
      .nonnegative("Allowances cannot be negative.")
      .max(500000, "Allowances seem too high. Please verify.")
      .optional(),
    
    // Optional additional details
    probation_period_months: z
      .number()
      .int("Probation period must be a whole number of months.")
      .min(0, "Probation period cannot be negative.")
      .max(12, "Probation period cannot exceed 12 months.")
      .optional(),
    
    notice_period_days: z
      .number()
      .int("Notice period must be a whole number of days.")
      .min(0, "Notice period cannot be negative.")
      .max(90, "Notice period cannot exceed 90 days.")
      .optional(),
    
    working_hours_per_week: z
      .number()
      .positive("Working hours must be positive.")
      .max(60, "Working hours cannot exceed 60 per week.")
      .optional(),
    
    // Special notes
    special_terms: z
      .string()
      .max(1000, "Special terms cannot exceed 1000 characters.")
      .optional(),
  })
  .refine((data) => {
    // Contract dates validation - allow same day contracts
    return data.contract_end_date >= data.contract_start_date
  }, {
    message: "Contract end date must be on or after the start date.",
    path: ["contract_end_date"],
  })
  .refine((data) => {
    // Different parties validation
    return data.first_party_id !== data.second_party_id
  }, {
    message: "Party A (Client) and Party B (Employer) must be different organizations.",
    path: ["second_party_id"],
  })
  .refine((data) => {
    // Contract duration validation - warn about very short or very long contracts
    const startDate = data.contract_start_date
    const endDate = data.contract_end_date
    const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Allow contracts from 1 day to 5 years
    return diffInDays >= 1 && diffInDays <= (5 * 365)
  }, {
    message: "Contract duration must be between 1 day and 5 years.",
    path: ["contract_end_date"],
  })
  .refine((data) => {
    // Future start date validation (allow today or future)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    return data.contract_start_date >= today
  }, {
    message: "Contract start date cannot be in the past.",
    path: ["contract_start_date"],
  })
  .refine((data) => {
    // Salary consistency check
    if (data.basic_salary && data.allowances) {
      const totalCompensation = data.basic_salary + data.allowances
      return totalCompensation <= 1500000 // Maximum total compensation check
    }
    return true
  }, {
    message: "Total compensation (salary + allowances) seems unusually high. Please verify.",
    path: ["allowances"],
  })

export type ContractGeneratorFormData = z.infer<typeof contractGeneratorSchema>

// Helper type for form sections
export interface FormSection {
  id: string
  title: string
  description?: string
  required: boolean
  fields: (keyof ContractGeneratorFormData)[]
}

// Form sections configuration
export const CONTRACT_FORM_SECTIONS: FormSection[] = [
  {
    id: "parties",
    title: "Contracting Parties",
    description: "Select the client and employer organizations",
    required: true,
    fields: ["first_party_id", "second_party_id"]
  },
  {
    id: "promoter",
    title: "Promoter Information", 
    description: "Select the individual who will be employed",
    required: true,
    fields: ["promoter_id"]
  },
  {
    id: "period",
    title: "Contract Period",
    description: "Define the employment duration",
    required: true,
    fields: ["contract_start_date", "contract_end_date"]
  },
  {
    id: "details",
    title: "Employment Details",
    description: "Specify job role and work arrangements",
    required: true,
    fields: ["email", "job_title", "department", "contract_type", "currency", "work_location"]
  },
  {
    id: "compensation",
    title: "Compensation (Optional)",
    description: "Define salary and benefits if applicable",
    required: false,
    fields: ["basic_salary", "allowances"]
  },
  {
    id: "terms",
    title: "Additional Terms (Optional)",
    description: "Specify probation, notice periods, and special conditions",
    required: false,
    fields: ["probation_period_months", "notice_period_days", "working_hours_per_week", "special_terms"]
  }
]

// Form validation helpers
export const getRequiredFields = (): (keyof ContractGeneratorFormData)[] => {
  return CONTRACT_FORM_SECTIONS
    .filter(section => section.required)
    .flatMap(section => section.fields)
}

export const getOptionalFields = (): (keyof ContractGeneratorFormData)[] => {
  return CONTRACT_FORM_SECTIONS
    .filter(section => !section.required)
    .flatMap(section => section.fields)
}
