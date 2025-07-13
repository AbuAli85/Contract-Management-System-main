import { createClient } from "@/lib/supabase/server"

export interface LogEntry {
  level: "info" | "warn" | "error" | "debug"
  message: string
  metadata?: Record<string, any>
  timestamp?: string
  userId?: string
  action?: string
  resource?: string
  resourceId?: string
}

export interface AuditLogEntry {
  action: string
  resource: string
  resourceId?: string
  userId?: string
  metadata?: Record<string, any>
  timestamp?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private webhookUrl = process.env.LOGGING_WEBHOOK_URL

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp || new Date().toISOString()
    const metadata = entry.metadata ? JSON.stringify(entry.metadata) : ""
    return `[${timestamp}] ${entry.level.toUpperCase()}: ${entry.message} ${metadata}`
  }

  private async sendToWebhook(entry: LogEntry): Promise<void> {
    if (!this.webhookUrl) return

    try {
      await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...entry,
          timestamp: entry.timestamp || new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error("Failed to send log to webhook:", error)
    }
  }

  async log(entry: LogEntry): Promise<void> {
    const formattedMessage = this.formatMessage(entry)

    // Always log to console in development
    if (this.isDevelopment) {
      switch (entry.level) {
        case "error":
          console.error(formattedMessage)
          break
        case "warn":
          console.warn(formattedMessage)
          break
        case "debug":
          console.debug(formattedMessage)
          break
        default:
          console.log(formattedMessage)
      }
    }

    // Send to webhook if configured
    await this.sendToWebhook(entry)
  }

  async info(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({ level: "info", message, metadata })
  }

  async warn(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({ level: "warn", message, metadata })
  }

  async error(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({ level: "error", message, metadata })
  }

  async debug(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({ level: "debug", message, metadata })
  }
}

// Create singleton instance
const logger = new Logger()

// Export the logAudit function
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient()

    // Try to get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const auditEntry = {
      ...entry,
      userId: entry.userId || user?.id,
      timestamp: entry.timestamp || new Date().toISOString(),
    }

    // Log to audit_logs table if it exists
    const { error } = await supabase.from("audit_logs").insert({
      action: auditEntry.action,
      resource: auditEntry.resource,
      resource_id: auditEntry.resourceId,
      user_id: auditEntry.userId,
      metadata: auditEntry.metadata,
      created_at: auditEntry.timestamp,
    })

    if (error) {
      // If audit_logs table doesn't exist or there's an error, fall back to regular logging
      await logger.info(`AUDIT: ${auditEntry.action} on ${auditEntry.resource}`, {
        resourceId: auditEntry.resourceId,
        userId: auditEntry.userId,
        metadata: auditEntry.metadata,
      })
    }
  } catch (error) {
    // Fallback to regular logging if audit logging fails
    await logger.error("Failed to log audit entry", {
      originalEntry: entry,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// Export default logger instance
export default logger

// Export individual methods for convenience
export const { info, warn, error, debug } = logger
