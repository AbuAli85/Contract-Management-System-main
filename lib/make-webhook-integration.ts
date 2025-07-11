// Make.com Webhook Integration for Contract Generation
// This integrates with the provided Make.com blueprint

import { createClient } from "@/lib/supabase/server"

export interface MakeWebhookPayload {
  contract_id: string
  contract_number: string
  first_party_name_en: string
  first_party_name_ar: string
  first_party_crn: string
  second_party_name_en: string
  second_party_name_ar: string
  second_party_crn: string
  promoter_name_en: string
  promoter_name_ar: string
  job_title?: string
  work_location?: string
  email?: string
  start_date: string
  end_date: string
  id_card_number?: string
  promoter_id_card_url?: string
  promoter_passport_url?: string
  pdf_url?: string
}

export interface MakeWebhookResponse {
  success: boolean
  pdf_url?: string
  contract_id: string
  images_processed?: {
    id_card: boolean
    passport: boolean
  }
  error?: string
}

export class MakeWebhookIntegration {
  private webhookUrl: string

  constructor() {
    // This is the webhook URL from your Make.com scenario
    this.webhookUrl = process.env.MAKE_CONTRACT_WEBHOOK_URL || ""
  }

  /**
   * Trigger contract generation via Make.com webhook
   */
  async generateContract(contractId: string): Promise<MakeWebhookResponse> {
    if (!this.webhookUrl) {
      return {
        success: false,
        contract_id: contractId,
        error: "Make.com webhook URL not configured",
      }
    }

    try {
      // Fetch contract data with all relations
      const supabase = await createClient()

      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select(
          `
          *,
          first_party:parties!contracts_first_party_id_fkey(*),
          second_party:parties!contracts_second_party_id_fkey(*),
          promoter:promoters(*)
        `
        )
        .eq("id", contractId)
        .single()

      if (contractError || !contract) {
        throw new Error("Contract not found")
      }

      // Prepare webhook payload
      const payload: MakeWebhookPayload = {
        contract_id: contract.id,
        contract_number: contract.contract_number,
        first_party_name_en: contract.first_party?.name_en || "",
        first_party_name_ar: contract.first_party?.name_ar || "",
        first_party_crn: contract.first_party?.crn || "",
        second_party_name_en: contract.second_party?.name_en || "",
        second_party_name_ar: contract.second_party?.name_ar || "",
        second_party_crn: contract.second_party?.crn || "",
        promoter_name_en: contract.promoter?.name_en || "",
        promoter_name_ar: contract.promoter?.name_ar || "",
        job_title: contract.job_title || "",
        work_location: contract.work_location || "",
        email: contract.promoter?.email || "",
        start_date: contract.contract_start_date,
        end_date: contract.contract_end_date,
        id_card_number: contract.promoter?.id_card_number || "",
        promoter_id_card_url: contract.promoter?.id_card_url || "",
        promoter_passport_url: contract.promoter?.passport_url || "",
      }

      // Send to Make.com webhook
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`)
      }

      const result = (await response.json()) as MakeWebhookResponse

      // Update contract status
      if (result.success && result.pdf_url) {
        await supabase
          .from("contracts")
          .update({
            pdf_url: result.pdf_url,
            status: "generated",
            document_generated_at: new Date().toISOString(),
          })
          .eq("id", contractId)
      }

      return result
    } catch (error) {
      console.error("Make.com webhook error:", error)
      return {
        success: false,
        contract_id: contractId,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Check if contract has all required data for generation
   */
  async validateContractData(contractId: string): Promise<{
    valid: boolean
    missingFields: string[]
  }> {
    const supabase = await createClient()

    const { data: contract, error } = await supabase
      .from("contracts")
      .select(
        `
        *,
        first_party:parties!contracts_first_party_id_fkey(*),
        second_party:parties!contracts_second_party_id_fkey(*),
        promoter:promoters(*)
      `
      )
      .eq("id", contractId)
      .single()

    if (error || !contract) {
      return { valid: false, missingFields: ["contract"] }
    }

    const missingFields: string[] = []

    // Check required fields
    if (!contract.contract_number) missingFields.push("contract_number")
    if (!contract.first_party?.name_en) missingFields.push("first_party_name")
    if (!contract.second_party?.name_en) missingFields.push("second_party_name")
    if (!contract.contract_start_date) missingFields.push("start_date")
    if (!contract.contract_end_date) missingFields.push("end_date")

    // Check if promoter is required based on template
    const templateName = contract.metadata?.template_name
    const promoterRequiredTemplates = [
      "Standard Employment Contract",
      "Service Agreement",
      "Freelance Contract",
    ]

    if (promoterRequiredTemplates.includes(templateName) && !contract.promoter?.name_en) {
      missingFields.push("promoter_name")
    }

    return {
      valid: missingFields.length === 0,
      missingFields,
    }
  }
}

// Singleton instance
export const makeWebhook = new MakeWebhookIntegration()
