import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface MakeWebhookPayload {
  contract_id: string
  contract_type: string
  party_a_name: string
  party_b_name: string
  contract_start_date: string
  contract_end_date: string
  contract_value?: number
  status: string
  template_id?: string
  created_at: string
}

export class MakeIntegration {
  private webhookUrl: string | null

  constructor() {
    this.webhookUrl = process.env.MAKE_WEBHOOK_URL || null
    if (!this.webhookUrl) {
      console.warn("Make.com webhook URL not configured")
    }
  }

  async triggerContractGeneration(payload: MakeWebhookPayload): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn("Make.com webhook URL not configured")
      return false
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("Make.com webhook triggered successfully:", result)
      return true
    } catch (error) {
      console.error("Error triggering Make.com webhook:", error)
      return false
    }
  }

  async getContractData(contractId: string) {
    try {
      const { data: contract, error } = await supabase
        .from("contracts")
        .select(`
          *,
          party_a:parties!contracts_party_a_id_fkey(*),
          party_b:parties!contracts_party_b_id_fkey(*)
        `)
        .eq("id", contractId)
        .single()

      if (error) throw error

      return contract
    } catch (error) {
      console.error("Error fetching contract data:", error)
      return null
    }
  }

  async processContractForMake(contractId: string): Promise<boolean> {
    try {
      const contract = await this.getContractData(contractId)
      if (!contract) {
        console.error("Contract not found:", contractId)
        return false
      }

      const payload: MakeWebhookPayload = {
        contract_id: contract.id,
        contract_type: contract.contract_type || "standard",
        party_a_name: contract.party_a?.name_en || "Unknown",
        party_b_name: contract.party_b?.name_en || "Unknown",
        contract_start_date: contract.contract_start_date,
        contract_end_date: contract.contract_end_date,
        contract_value: contract.contract_value,
        status: contract.status || "draft",
        template_id: contract.template_id,
        created_at: contract.created_at,
      }

      return await this.triggerContractGeneration(payload)
    } catch (error) {
      console.error("Error processing contract for Make.com:", error)
      return false
    }
  }
}

export const makeIntegration = new MakeIntegration()
