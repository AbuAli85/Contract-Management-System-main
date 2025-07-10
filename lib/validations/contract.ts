import { z } from "zod"
import { isValid, parse } from "date-fns"
import { createOptionalFileSchema } from "../utils"

// Helper for DD-MM-YYYY date string validation and transformation
const dateSchemaDdMmYyyy = z
  .string()
  .refine(
    (value) => {
      if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return false
      const parsedDate = parse(value, "dd-MM-yyyy", new Date())
      return isValid(parsedDate)
    },
    { message: "Invalid date format. Use DD-MM-YYYY." },
  )
  .transform((value) => parse(value, "dd-MM-yyyy", new Date())) // Transform to Date object for internal use

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]

const fileSchemaOptional = createOptionalFileSchema(
  MAX_FILE_SIZE,
  ACCEPTED_IMAGE_TYPES,
  "Max file size is 5MB.",
  ".jpg, .jpeg, .png, .webp, and .pdf files are accepted.",
)

export const ContractFormSchema = z
  .object({
    firstPartyId: z.string().min(1, "Party A is required."),
    secondPartyId: z.string().min(1, "Party B is required."),
    promoterId: z.string().min(1, "Promoter is required."),

    contractStartDate: dateSchemaDdMmYyyy,
    contractEndDate: dateSchemaDdMmYyyy,

    jobTitleEn: z.string().min(1, "Job title (English) is required."),
    jobTitleAr: z.string().min(1, "Job title (Arabic) is required."),

    salaryAmount: z.coerce.number().positive("Salary must be a positive number."),
    salaryCurrency: z.string().min(1, "Salary currency is required (e.g., SAR, USD)."),

    workingHours: z.string().min(1, "Working hours details are required."),
    workingDays: z.string().min(1, "Working days details are required."),
    annualLeaveDays: z.coerce.number().int().min(0, "Annual leave must be a non-negative integer."),

    probationPeriodMonths: z.coerce
      .number()
      .int()
      .min(0, "Probation period must be a non-negative integer.")
      .optional()
      .nullable(),
    noticePeriodDays: z.coerce
      .number()
      .int()
      .min(0, "Notice period must be a non-negative integer.")
      .optional()
      .nullable(),

    additionalClausesEn: z.string().optional().nullable(),
    additionalClausesAr: z.string().optional().nullable(),

    // Fields for promoter details that might be part of this specific contract generation context
    // These might be pre-filled or part of a sub-form.
    // If these are for creating/updating a promoter record itself, they belong in promoterFormSchema.
    // For this example, let's assume some promoter document details are captured with the contract.
    promoterIdCardCopy: fileSchemaOptional,
    promoterPassportCopy: fileSchemaOptional,
    // Add other fields as necessary for your contract generation form
  })
  .refine(
    (data) => {
      if (data.contractStartDate && data.contractEndDate) {
        return data.contractEndDate >= data.contractStartDate
      }
      return true
    },
    {
      message: "Contract end date cannot be before the start date.",
      path: ["contractEndDate"], // Point error to this field
    },
  )

export type ContractFormData = z.infer<typeof ContractFormSchema>
