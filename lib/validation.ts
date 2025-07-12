import { z } from "zod"
import { createOptionalFileSchema, validateEmail, validatePhone } from "@/lib/utils"

// Contract validation schema
export const contractSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be less than 100 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(1000, "Description must be less than 1000 characters"),
    parties: z.array(z.string().uuid("Invalid party ID")).min(2, "At least 2 parties required"),
    start_date: z.date({ required_error: "Start date is required" }),
    end_date: z.date({ required_error: "End date is required" }),
    value: z
      .number()
      .positive("Value must be positive")
      .max(1000000000, "Value cannot exceed 1 billion"),
    currency: z.string().length(3, "Currency must be 3 characters").default("USD"),
    status: z.enum(["draft", "active", "completed", "terminated", "expired"]).default("draft"),
    terms: z.string().optional(),
    attachments: z
      .array(
        createOptionalFileSchema(
          10 * 1024 * 1024, // 10MB
          ["application/pdf", "image/jpeg", "image/png", "application/msword"],
          "File size must be less than 10MB",
          "File type must be PDF, JPEG, PNG, or DOC"
        )
      )
      .optional(),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
  })

// Party validation schema
export const partySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string().email("Invalid email format").refine(validateEmail, "Invalid email format"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .refine(validatePhone, "Invalid phone format"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be less than 200 characters"),
  role: z.enum(["employer", "employee", "promoter", "witness", "guarantor"]),
  company: z.string().optional(),
  national_id: z.string().optional(),
  tax_id: z.string().optional(),
  bank_details: z
    .object({
      account_number: z.string().optional(),
      bank_name: z.string().optional(),
      routing_number: z.string().optional(),
    })
    .optional(),
})

// Promoter validation schema
export const promoterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string().email("Invalid email format").refine(validateEmail, "Invalid email format"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .refine(validatePhone, "Invalid phone format"),
  commission_rate: z
    .number()
    .min(0, "Commission rate cannot be negative")
    .max(100, "Commission rate cannot exceed 100%"),
  specialization: z.string().optional(),
  license_number: z.string().optional(),
  experience_years: z
    .number()
    .min(0, "Experience cannot be negative")
    .max(50, "Experience cannot exceed 50 years")
    .optional(),
})

// User profile validation schema
export const userProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must be less than 50 characters"),
  email: z.string().email("Invalid email format").refine(validateEmail, "Invalid email format"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .refine(validatePhone, "Invalid phone format")
    .optional(),
  avatar: createOptionalFileSchema(
    5 * 1024 * 1024, // 5MB
    ["image/jpeg", "image/png", "image/gif"],
    "Avatar must be less than 5MB",
    "Avatar must be JPEG, PNG, or GIF"
  ),
  preferences: z
    .object({
      language: z.enum(["en", "ar"]).default("en"),
      theme: z.enum(["light", "dark", "system"]).default("system"),
      notifications: z
        .object({
          email: z.boolean().default(true),
          push: z.boolean().default(true),
          contract_updates: z.boolean().default(true),
          payment_reminders: z.boolean().default(true),
        })
        .optional(),
    })
    .optional(),
})

// Search validation schema
export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100),
  filters: z
    .object({
      status: z.enum(["draft", "active", "completed", "terminated", "expired"]).optional(),
      date_range: z
        .object({
          start: z.date().optional(),
          end: z.date().optional(),
        })
        .optional(),
      value_range: z
        .object({
          min: z.number().min(0).optional(),
          max: z.number().min(0).optional(),
        })
        .optional(),
      parties: z.array(z.string().uuid()).optional(),
    })
    .optional(),
  pagination: z
    .object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
})

// Form validation helpers
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  try {
    const validData = schema.parse(data)
    return { success: true, data: validData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join(".")
        errors[path] = err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: { general: "Validation failed" } }
  }
}

// Type exports
export type ContractFormData = z.infer<typeof contractSchema>
export type PartyFormData = z.infer<typeof partySchema>
export type PromoterFormData = z.infer<typeof promoterSchema>
export type UserProfileFormData = z.infer<typeof userProfileSchema>
export type SearchFormData = z.infer<typeof searchSchema>
