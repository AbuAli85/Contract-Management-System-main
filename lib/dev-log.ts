export function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development") {
    console.log(...args)
  }
}

// Debug function for navigation issues
export function debugNavigation(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [Navigation Debug] ${message}`, data || '')
  }
}
