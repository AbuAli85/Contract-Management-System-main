import { z } from "zod"

export type UserRole = "admin" | "user"

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  isActive: boolean
  emailVerifiedAt?: Date
  mfaEnabled: boolean
}

export interface Session {
  id: string
  userId: string
  refreshToken: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
}

export interface AuthLog {
  id: string
  userId?: string
  eventType: AuthEventType
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  success: boolean
  errorMessage?: string
  createdAt: Date
}

export type AuthEventType =
  | "sign_up"
  | "sign_in"
  | "sign_out"
  | "password_reset_request"
  | "password_reset_complete"
  | "email_verification"
  | "mfa_enable"
  | "mfa_disable"
  | "mfa_verify"
  | "session_refresh"
  | "account_locked"
  | "account_unlocked"

// Validation schemas
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  fullName: z.string().min(2, "Full name is required"),
  acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms"),
})

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user"]),
  sendEmail: z.boolean().default(true),
})

export const mfaVerifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must be numeric"),
})

export const mfaBackupCodeSchema = z.object({
  backupCode: z.string().min(1, "Backup code is required"),
})
