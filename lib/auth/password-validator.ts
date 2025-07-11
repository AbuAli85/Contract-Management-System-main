import { z } from "zod"

export interface PasswordStrength {
  score: number // 0-5
  feedback: string[]
  suggestions: string[]
  isStrong: boolean
}

export interface PasswordRequirements {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
  preventUserInfo: boolean
  preventRepeatingChars: boolean
  preventSequentialChars: boolean
}

// Default password requirements
export const defaultPasswordRequirements: PasswordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  preventRepeatingChars: true,
  preventSequentialChars: true,
}

// Common passwords list (top 1000)
const commonPasswords = new Set([
  "password",
  "123456",
  "password123",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "1234567890",
  "qwerty",
  "abc123",
  "Password1",
  "password1",
  "123123",
  "welcome123",
  "admin123",
  "root",
  "toor",
  "pass",
  "test",
  "guest",
  "master",
  "hello",
  "hello123",
  "1234",
  "12345",
  "123456789",
  // Add more common passwords...
])

// Check password strength
export function checkPasswordStrength(
  password: string,
  requirements: PasswordRequirements = defaultPasswordRequirements,
  userInfo?: { email?: string; name?: string }
): PasswordStrength {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 0

  // Length check
  if (password.length >= requirements.minLength) {
    score += 1
  } else {
    feedback.push(`Password must be at least ${requirements.minLength} characters long`)
    suggestions.push(`Add ${requirements.minLength - password.length} more characters`)
  }

  // Uppercase check
  if (requirements.requireUppercase) {
    if (/[A-Z]/.test(password)) {
      score += 0.5
    } else {
      feedback.push("Password must contain at least one uppercase letter")
      suggestions.push("Add an uppercase letter (A-Z)")
    }
  }

  // Lowercase check
  if (requirements.requireLowercase) {
    if (/[a-z]/.test(password)) {
      score += 0.5
    } else {
      feedback.push("Password must contain at least one lowercase letter")
      suggestions.push("Add a lowercase letter (a-z)")
    }
  }

  // Number check
  if (requirements.requireNumbers) {
    if (/\d/.test(password)) {
      score += 0.5
    } else {
      feedback.push("Password must contain at least one number")
      suggestions.push("Add a number (0-9)")
    }
  }

  // Special character check
  if (requirements.requireSpecialChars) {
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 0.5
    } else {
      feedback.push("Password must contain at least one special character")
      suggestions.push("Add a special character (!@#$%^&*)")
    }
  }

  // Common password check
  if (requirements.preventCommonPasswords) {
    if (commonPasswords.has(password.toLowerCase())) {
      score = Math.max(0, score - 2)
      feedback.push("This password is too common")
      suggestions.push("Choose a more unique password")
    }
  }

  // User info check
  if (requirements.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase()

    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split("@")[0].split(/[._-]/)
      for (const part of emailParts) {
        if (part.length > 3 && lowerPassword.includes(part)) {
          score = Math.max(0, score - 1)
          feedback.push("Password should not contain parts of your email")
          suggestions.push("Avoid using personal information")
          break
        }
      }
    }

    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(/\s+/)
      for (const part of nameParts) {
        if (part.length > 3 && lowerPassword.includes(part)) {
          score = Math.max(0, score - 1)
          feedback.push("Password should not contain your name")
          suggestions.push("Avoid using personal information")
          break
        }
      }
    }
  }

  // Repeating characters check
  if (requirements.preventRepeatingChars) {
    if (/(.)\1{2,}/.test(password)) {
      score = Math.max(0, score - 0.5)
      feedback.push("Avoid repeating characters")
      suggestions.push("Replace repeated characters with different ones")
    }
  }

  // Sequential characters check
  if (requirements.preventSequentialChars) {
    const sequences = [
      "abc",
      "bcd",
      "cde",
      "def",
      "efg",
      "fgh",
      "ghi",
      "hij",
      "ijk",
      "jkl",
      "klm",
      "lmn",
      "mno",
      "nop",
      "opq",
      "pqr",
      "qrs",
      "rst",
      "stu",
      "tuv",
      "uvw",
      "vwx",
      "wxy",
      "xyz",
      "012",
      "123",
      "234",
      "345",
      "456",
      "567",
      "678",
      "789",
    ]

    const lowerPassword = password.toLowerCase()
    for (const seq of sequences) {
      if (lowerPassword.includes(seq) || lowerPassword.includes(seq.split("").reverse().join(""))) {
        score = Math.max(0, score - 0.5)
        feedback.push("Avoid sequential characters")
        suggestions.push("Replace sequential characters with random ones")
        break
      }
    }
  }

  // Entropy bonus for length and variety
  if (password.length > 15) score += 0.5
  if (password.length > 20) score += 0.5

  // Character variety bonus
  const charTypes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  ].filter(Boolean).length

  if (charTypes === 4) score += 1

  // Normalize score to 0-5
  score = Math.min(5, Math.max(0, score))

  return {
    score,
    feedback,
    suggestions,
    isStrong: score >= 3 && feedback.length === 0,
  }
}

// Zod schema for password validation
export function createPasswordSchema(
  requirements: PasswordRequirements = defaultPasswordRequirements
) {
  return z
    .string()
    .min(requirements.minLength, `Password must be at least ${requirements.minLength} characters`)
    .refine(
      (val) => !requirements.requireUppercase || /[A-Z]/.test(val),
      "Password must contain at least one uppercase letter"
    )
    .refine(
      (val) => !requirements.requireLowercase || /[a-z]/.test(val),
      "Password must contain at least one lowercase letter"
    )
    .refine(
      (val) => !requirements.requireNumbers || /\d/.test(val),
      "Password must contain at least one number"
    )
    .refine(
      (val) =>
        !requirements.requireSpecialChars || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
      "Password must contain at least one special character"
    )
    .refine(
      (val) => !requirements.preventCommonPasswords || !commonPasswords.has(val.toLowerCase()),
      "This password is too common"
    )
    .refine(
      (val) => !requirements.preventRepeatingChars || !/(.)\1{2,}/.test(val),
      "Password should not contain repeating characters"
    )
}

// Check if password was previously used
export async function checkPasswordHistory(
  userId: string,
  passwordHash: string,
  supabase: any,
  limit: number = 5
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("password_history")
    .eq("id", userId)
    .single()

  if (!profile?.password_history) return false

  const history = profile.password_history.slice(0, limit)
  return history.includes(passwordHash)
}

// Update password history
export async function updatePasswordHistory(
  userId: string,
  passwordHash: string,
  supabase: any,
  maxHistory: number = 10
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("password_history")
    .eq("id", userId)
    .single()

  const history = profile?.password_history || []
  history.unshift(passwordHash)

  await supabase
    .from("profiles")
    .update({
      password_history: history.slice(0, maxHistory),
      password_changed_at: new Date().toISOString(),
    })
    .eq("id", userId)
}
