import { createClient } from "@/lib/supabase/server"

interface LogLevel {
  INFO: "info"
  ERROR: "error"
  WARN: "warn"
  DEBUG: "debug"
}

const LOG_LEVELS: LogLevel = {
  INFO: "info",
  ERROR: "error",
  WARN: "warn",
  DEBUG: "debug",
}

export interface LogEntry {
  level: "info" | "warn" | "error" | "debug"
  message: string
  timestamp: string
  userId?: string
  metadata?: Record<string, any>
}

export interface AuditLogEntry {
  action: string
  entity_type: string
  entity_id: string
  details?: Record<string, any>
  user_id?: string
  ip_address?: string
  user_agent?: string
  success?: boolean
}

class Logger {
  private logs: LogEntry[] = []
  private auditLogs: AuditLogEntry[] = []
  private maxLogs = 1000
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatMessage(level: keyof LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? `[${context}]` : ""
    return `[${timestamp}] [${level.toUpperCase()}] ${contextStr} ${message}`
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry)

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  private addAuditLog(entry: AuditLogEntry): void {
    this.auditLogs.push(entry)

    // Keep only the last maxLogs entries
    if (this.auditLogs.length > this.maxLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxLogs)
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Implement external logging service integration here
    // For example: send to DataDog, LogRocket, Sentry, etc.
    try {
      // Example implementation - replace with your preferred service
      if (process.env.LOGGING_WEBHOOK_URL) {
        await fetch(process.env.LOGGING_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entry),
        })
      }
    } catch (error) {
      console.error("Failed to send log to external service:", error)
    }
  }

  log(level: LogEntry["level"], message: string, metadata?: Record<string, any>, userId?: string): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      userId,
      metadata,
    }

    this.logs.push(entry)

    // Console output for development
    if (this.isDevelopment) {
      console.log(`[${entry.level.toUpperCase()}] ${entry.timestamp}: ${entry.message}`, metadata)
    }

    // In production, you might want to send logs to an external service
    if (!this.isDevelopment) {
      this.sendToExternalService(entry)
    }
  }

  info(message: string, metadata?: Record<string, any>, userId?: string): void {
    this.log("info", message, metadata, userId)
  }

  error(message: string, metadata?: Record<string, any>, userId?: string): void {
    this.log("error", message, metadata, userId)
  }

  warn(message: string, metadata?: Record<string, any>, userId?: string): void {
    this.log("warn", message, metadata, userId)
  }

  debug(message: string, metadata?: Record<string, any>, userId?: string): void {
    if (!this.isDevelopment) return

    this.log("debug", message, metadata, userId)
  }

  // Audit logging method
  audit(action: string, resource: string, userId?: string, details?: any): void {
    const auditEntry: AuditLogEntry = {
      action,
      entity_type: resource,
      entity_id: resource,
      details,
      user_id: userId,
      ip_address: typeof window !== "undefined" ? "client" : "server",
      user_agent: typeof window !== "undefined" ? navigator.userAgent : undefined,
      success: true,
    }

    this.addAuditLog(auditEntry)
    this.info(`AUDIT: ${action} on ${resource}`, auditEntry, "AUDIT")
  }

  // Get logs for debugging or audit purposes
  getLogs(level?: keyof LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level)
    }
    return [...this.logs]
  }

  // Get audit logs
  getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs]
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
  }

  // Clear audit logs
  clearAuditLogs(): void {
    this.auditLogs = []
  }

  // Export logs for analysis
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Export audit logs for analysis
  exportAuditLogs(): string {
    return JSON.stringify(this.auditLogs, null, 2)
  }
}

// Create singleton instance
const logger = new Logger()

// Export the logger instance and convenience functions
export { logger }

export const logInfo = (message: string, metadata?: Record<string, any>, userId?: string) =>
  logger.info(message, metadata, userId)

export const logWarn = (message: string, metadata?: Record<string, any>, userId?: string) =>
  logger.warn(message, metadata, userId)

export const logError = (message: string, metadata?: Record<string, any>, userId?: string) =>
  logger.error(message, metadata, userId)

export const logDebug = (message: string, metadata?: Record<string, any>, userId?: string) =>
  logger.debug(message, metadata, userId)

// Audit logging function
export async function logAudit(
  action: string,
  message: string,
  entityId: string,
  entityType = "general",
  details?: Record<string, any>,
  userId?: string,
  ipAddress?: string,
  userAgent?: string,
  success = true,
) {
  try {
    const supabase = await createClient()

    // Get current user if not provided
    let currentUserId = userId
    if (!currentUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      currentUserId = user?.id
    }

    const auditEntry: AuditLogEntry = {
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: {
        message,
        ...details,
      },
      user_id: currentUserId,
      ip_address: ipAddress,
      user_agent: userAgent,
      success,
    }

    // Insert into audit_logs table
    const { error } = await supabase.from("audit_logs").insert(auditEntry)

    if (error) {
      console.error("Failed to insert audit log:", error)
      // Log to regular logger as fallback
      logger.error("Audit log insertion failed", {
        error: error.message,
        auditEntry,
      })
    }

    // Also log to regular logger for development
    logger.info(`AUDIT: ${action} - ${message}`, {
      entityType,
      entityId,
      userId: currentUserId,
      success,
      details,
    })
  } catch (error) {
    console.error("Error in logAudit:", error)
    // Fallback to regular logging
    logger.error(`AUDIT FAILED: ${action} - ${message}`, {
      error: error instanceof Error ? error.message : "Unknown error",
      entityType,
      entityId,
      details,
    })
  }
}

// Convenience audit logging functions
export const logAuditSuccess = (
  action: string,
  message: string,
  entityId: string,
  entityType?: string,
  details?: Record<string, any>,
) => logAudit(action, message, entityId, entityType, details, undefined, undefined, undefined, true)

export const logAuditFailure = (
  action: string,
  message: string,
  entityId: string,
  entityType?: string,
  details?: Record<string, any>,
) => logAudit(action, message, entityId, entityType, details, undefined, undefined, undefined, false)

// Export default logger
export default logger
