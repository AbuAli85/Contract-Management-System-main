import { supabase } from "./supabase"

export interface AuditLogEntry {
  action: string
  resource_type: string
  resource_id: string
  user_id?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp?: string
}

export interface LogLevel {
  ERROR: "error"
  WARN: "warn"
  INFO: "info"
  DEBUG: "debug"
}

export const LOG_LEVELS: LogLevel = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
}

// Logger class for handling application logging
class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private logLevel = process.env.LOG_LEVEL || "info"

  private shouldLog(level: string): boolean {
    const levels = ["error", "warn", "info", "debug"]
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex <= currentLevelIndex
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`
    }
    return `${prefix} ${message}`
  }

  error(message: string, data?: any): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, data))
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, data))
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, data))
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog("debug") && this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, data))
    }
  }
}

// Create singleton logger instance
export const logger = new Logger()

// Audit logging function
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const auditEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      user_id: entry.user_id || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      logger.info("Audit Log", auditEntry)
    }

    // Store in database
    const { error } = await supabase.from("audit_logs").insert([auditEntry])

    if (error) {
      logger.error("Failed to store audit log", { error, entry: auditEntry })
      // Don't throw error to prevent breaking the main operation
    }
  } catch (error) {
    logger.error("Error in logAudit function", { error, entry })
    // Fallback: log to console if database fails
    console.error("AUDIT LOG FALLBACK:", entry)
  }
}

// Performance logging
export function logPerformance(operation: string, startTime: number, metadata?: any): void {
  const duration = Date.now() - startTime
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...metadata,
  })
}

// Error logging with context
export function logError(error: Error, context?: string, metadata?: any): void {
  logger.error(`${context ? `[${context}] ` : ""}${error.message}`, {
    stack: error.stack,
    ...metadata,
  })
}

// Database operation logging
export async function logDatabaseOperation(
  operation: string,
  table: string,
  recordId?: string,
  metadata?: any,
): Promise<void> {
  await logAudit({
    action: `DB_${operation.toUpperCase()}`,
    resource_type: table,
    resource_id: recordId || "unknown",
    details: {
      operation,
      table,
      ...metadata,
    },
  })
}

// User action logging
export async function logUserAction(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: any,
): Promise<void> {
  await logAudit({
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    user_id: userId,
    details,
  })
}

// Security event logging
export async function logSecurityEvent(
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  details?: any,
): Promise<void> {
  await logAudit({
    action: `SECURITY_${event.toUpperCase()}`,
    resource_type: "security",
    resource_id: "system",
    details: {
      severity,
      ...details,
    },
  })

  // Also log to console for immediate attention
  logger.error(`Security Event: ${event}`, { severity, details })
}

// Export default logger instance
export default logger
