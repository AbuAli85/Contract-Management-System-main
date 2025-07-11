// Production logging utilities

/**
 * Log function for production use
 * Only logs in development environment
 */
export function devLog(message: string, data?: any) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dev] ${message}`, data || "")
  }
}

/**
 * Error logging function
 * Logs errors in all environments for monitoring
 */
export function logError(message: string, error?: any) {
  console.error(`[Error] ${message}`, error || "")

  // In production, you might want to send to error tracking service
  if (process.env.NODE_ENV === "production") {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, { message })
  }
}

/**
 * Warning logging function
 */
export function logWarning(message: string, data?: any) {
  console.warn(`[Warning] ${message}`, data || "")
}

/**
 * Info logging function for important events
 */
export function logInfo(message: string, data?: any) {
  console.info(`[Info] ${message}`, data || "")
}
