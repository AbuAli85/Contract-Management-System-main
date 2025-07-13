import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Supabase URL is required. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.")
  }
  if (!supabaseServiceRoleKey) {
    throw new Error("Supabase Service Role Key is required. Please set SUPABASE_SERVICE_ROLE_KEY.")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { contract_id } = body

    if (!contract_id) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 })
    }

    // Get contract data
    const { data: contract, error } = await supabase
      .from("contracts")
      .select(
        `
        *,
        client_company:companies!contracts_client_company_id_fkey(*),
        employer_company:companies!contracts_employer_company_id_fkey(*),
        promoter:promoters(*)
      `,
      )
      .eq("id", contract_id)
      .single()

    if (error || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Trigger Make.com webhook
    const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL
    if (!makeWebhookUrl) {
      console.warn("Make.com webhook URL not configured")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    const webhookPayload = {
      contract_number: contract.contract_number,
      contract_id: contract.id,
      first_party_name_en: contract.client_company?.name_en || "",
      first_party_name_ar: contract.client_company?.name_ar || "",
      second_party_name_en: contract.employer_company?.name_en || "",
      second_party_name_ar: contract.employer_company?.name_ar || "",
      promoter_name_en: contract.promoter?.name_en || "",
      promoter_name_ar: contract.promoter?.name_ar || "",
      job_title: contract.job_title || "",
      work_location: contract.work_location || "",
      start_date: contract.start_date,
      end_date: contract.end_date,
    }

    const response = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`)
    }

    return NextResponse.json({ success: true, message: "Contract generation triggered" })
  } catch (error) {
    console.error("Generate contract error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
