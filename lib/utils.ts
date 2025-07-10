import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

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
  typeMessage: string,
) {
  return z
    .any()
    .refine(
      (file) =>
        !file ||
        (isBrowser ? file instanceof File && file.size <= maxFileSize : file.size <= maxFileSize),
      sizeMessage,
    )
    .refine(
      (file) =>
        !file ||
        (isBrowser
          ? file instanceof File && acceptedTypes.includes(file.type)
          : acceptedTypes.includes(file.type)),
      typeMessage,
    )
    .optional()
    .nullable()
}

export function getPartyDetails(parties: any[]) {
    const employer = parties.find(p => p.role === 'employer');
    const employee = parties.find(p => p.role === 'employee');
    const promoter = parties.find(p => p.role === 'promoter');
    return {employer, employee, promoter};
}

export function calculateDuration(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMs = end.getTime() - start.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return `${diffInDays} days`;
}
