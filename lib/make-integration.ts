// Make.com (Integromat) Integration
// Handles webhook communication with Make.com scenarios

import { ContractInsert } from "@/app/actions/contracts"
import { Party, Promoter } from "@/lib/types"

interface MakeWebhookPayload {
  contractId: string
  templateId: string
  contractData: {
    contractNumber: string
    firstParty: Party
    secondParty: Party
    promoter: Promoter
    startDate: string
    endDate: string
    value?: number | null
    jobTitle?: string | null
    workLocation?: string | null
    metadata?: Record<string, any>
  }
  callbackUrl?: string
}

interface MakeWebhookResponse {
  success: boolean
  documentUrl?: string
  error?: string
  processId?: string
}

export class MakeIntegration {
  private webhookUrl: string
  private apiKey: string

  constructor() {
    this.webhookUrl = process.env.MAKE_WEBHOOK_URL || ""
    this.apiKey = process.env.MAKE_API_KEY || ""

    if (!this.webhookUrl) {
      console.warn("Make.com webhook URL not configured")
    }
  }

  /**
   * Send contract data to Make.com for document generation
   */
  async generateDocument(
    contractId: string,
    templateId: string,
    contractData: any,
    parties: { first: Party; second: Party },
    promoter: Promoter
  ): Promise<MakeWebhookResponse> {
    if (!this.webhookUrl) {
      return {
        success: false,
        error: "Make.com integration not configured",
      }
    }

    try {
      const payload: MakeWebhookPayload = {
        contractId,
        templateId,
        contractData: {
          contractNumber: contractData.contract_number,
          firstParty: parties.first,
          secondParty: parties.second,
          promoter: promoter,
          startDate: contractData.contract_start_date,
          endDate: contractData.contract_end_date,
          value: contractData.contract_value,
          jobTitle: contractData.job_title,
          workLocation: contractData.work_location,
          metadata: contractData.metadata || {},
        },
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/make/callback`,
      }

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
          "X-Contract-ID": contractId,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Make.com webhook failed: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        success: true,
        documentUrl: result.documentUrl,
        processId: result.processId,
      }
    } catch (error) {
      console.error("Make.com integration error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  /**
   * Check the status of a document generation process
   */
  async checkStatus(processId: string): Promise<{
    status: "pending" | "completed" | "failed"
    documentUrl?: string
    error?: string
  }> {
    if (!this.webhookUrl) {
      return {
        status: "failed",
        error: "Make.com integration not configured",
      }
    }

    try {
      const response = await fetch(`${this.webhookUrl}/status/${processId}`, {
        headers: {
          "X-API-Key": this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Handle callback from Make.com when document is ready
   */
  async handleCallback(data: any): Promise<void> {
    const { contractId, documentUrl, status, error } = data

    if (status === "completed" && documentUrl) {
      // Update contract with document URL
      await this.updateContractDocument(contractId, documentUrl)
    } else if (status === "failed") {
      // Log error and notify
      console.error(`Document generation failed for contract ${contractId}:`, error)
      // You could send a notification here
    }
  }

  private async updateContractDocument(contractId: string, documentUrl: string) {
    // This would update the contract in Supabase with the generated document URL
    // Implementation depends on your Supabase setup
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()

    const { error } = await supabase
      .from("contracts")
      .update({
        document_url: documentUrl,
        document_generated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (error) {
      console.error("Failed to update contract document:", error)
    }
  }
}

// Singleton instance
export const makeIntegration = new MakeIntegration()
