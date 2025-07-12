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

interface LogEntry {
  level: keyof LogLevel
  message: string
  timestamp: Date
  context?: string
  data?: any
  userId?: string
  sessionId?: string
}

class Logger {
  private logs: LogEntry[] = []
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

  private sendToExternalService(entry: LogEntry): void {
    // In production, send to external logging service
    // Example: Sentry, LogRocket, etc.
    if (!this.isDevelopment) {
      // Implementation for external logging service
      console.log("Sending to external service:", entry)
    }
  }

  info(message: string, data?: any, context?: string): void {
    const entry: LogEntry = {
      level: "INFO",
      message,
      timestamp: new Date(),
      context,
      data,
    }

    console.log(this.formatMessage("INFO", message, context), data)
    this.addLog(entry)
  }

  error(message: string, error?: any, context?: string): void {
    const entry: LogEntry = {
      level: "ERROR",
      message,
      timestamp: new Date(),
      context,
      data:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    }

    console.error(this.formatMessage("ERROR", message, context), error)
    this.addLog(entry)
    this.sendToExternalService(entry)
  }

  warn(message: string, data?: any, context?: string): void {
    const entry: LogEntry = {
      level: "WARN",
      message,
      timestamp: new Date(),
      context,
      data,
    }

    console.warn(this.formatMessage("WARN", message, context), data)
    this.addLog(entry)
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.isDevelopment) return

    const entry: LogEntry = {
      level: "DEBUG",
      message,
      timestamp: new Date(),
      context,
      data,
    }

    console.debug(this.formatMessage("DEBUG", message, context), data)
    this.addLog(entry)
  }

  // Get logs for debugging or audit purposes
  getLogs(level?: keyof LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level)
    }
    return [...this.logs]
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
  }

  // Export logs for analysis
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = new Logger()

// Audit logging for sensitive operations
export function auditLog(action: string, resource: string, userId?: string, details?: any): void {
  const auditEntry = {
    action,
    resource,
    userId,
    details,
    timestamp: new Date().toISOString(),
    ip: typeof window !== "undefined" ? "client" : "server",
  }

  logger.info(`AUDIT: ${action} on ${resource}`, auditEntry, "AUDIT")
}
