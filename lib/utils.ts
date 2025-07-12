import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"
import { toast } from "@/components/ui/use-toast"

/**
 * Determine if the current runtime has access to the browser `File` API.
 * This helps schemas validate file inputs only when the `File` constructor
 * exists, which is not the case in server environments.
 */
export const isBrowser = typeof window !== "undefined" && typeof File !== "undefined"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build a zod schema for optional file inputs.
 * This centralizes browser-aware file validation so individual schemas
 * don't repeat the logic.
 */
export function createOptionalFileSchema(
  maxFileSize: number,
  acceptedTypes: string[],
  sizeMessage: string,
  typeMessage: string
) {
  return z
    .any()
    .refine(
      (file) =>
        !file ||
        (isBrowser ? file instanceof File && file.size <= maxFileSize : file.size <= maxFileSize),
      sizeMessage
    )
    .refine(
      (file) =>
        !file ||
        (isBrowser
          ? file instanceof File && acceptedTypes.includes(file.type)
          : acceptedTypes.includes(file.type)),
      typeMessage
    )
    .optional()
    .nullable()
}

export function getPartyDetails(parties: any[]) {
  const employer = parties.find((p) => p.role === "employer")
  const employee = parties.find((p) => p.role === "employee")
  const promoter = parties.find((p) => p.role === "promoter")
  return { employer, employee, promoter }
}

export function calculateDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffInMs = end.getTime() - start.getTime()
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
  return `${Math.round(diffInDays)} days`
}

// Enhanced error handling utilities
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function handleError(error: unknown, context?: string) {
  console.error(`[${context || "Unknown"}] Error:`, error)

  if (error instanceof AppError) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    })
  } else if (error instanceof Error) {
    toast({
      title: "Unexpected Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    })
  }
}

// Performance measurement utility
export function measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now()

    try {
      const result = await fn()
      const end = performance.now()

      console.log(`[PERF] ${name}: ${end - start}ms`)

      // Report to analytics service if available
      if (typeof window !== "undefined" && "gtag" in window) {
        // @ts-ignore
        gtag("event", "timing_complete", {
          name: name,
          value: Math.round(end - start),
        })
      }

      resolve(result)
    } catch (error) {
      reject(error)
    }
  })
}

// Data formatting utilities
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date, locale: string = "en-US"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj)
}

export function formatRelativeTime(date: string | Date, locale: string = "en-US"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  const diffInMs = dateObj.getTime() - now.getTime()
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffInDays) < 1) {
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60))
    return rtf.format(diffInHours, "hour")
  }

  return rtf.format(diffInDays, "day")
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]+$/
  return phoneRegex.test(phone)
}

// Debounce utility for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// Storage utilities
export const storage = {
  get: (key: string) => {
    if (!isBrowser) return null
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set: (key: string, value: any) => {
    if (!isBrowser) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error("Failed to store item:", error)
    }
  },
  remove: (key: string) => {
    if (!isBrowser) return
    localStorage.removeItem(key)
  },
  clear: () => {
    if (!isBrowser) return
    localStorage.clear()
  },
}
