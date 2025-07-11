import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contractId = params.id
    console.log("Testing contract generation for ID:", contractId)

    // Check environment variables
    const webhookUrl = process.env.MAKE_CONTRACT_WEBHOOK_URL
    const hasWebhook = !!webhookUrl

    // Test Supabase connection
    const supabase = await createClient()

    // Fetch contract data
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

    if (contractError) {
      return NextResponse.json(
        {
          error: "Contract fetch error",
          details: contractError,
          contractId,
        },
        { status: 404 }
      )
    }

    // Check required fields
    const missingFields = []
    if (!contract.contract_number) missingFields.push("contract_number")
    if (!contract.first_party) missingFields.push("first_party")
    if (!contract.second_party) missingFields.push("second_party")
    if (!contract.promoter) missingFields.push("promoter")
    if (!contract.contract_start_date) missingFields.push("start_date")
    if (!contract.contract_end_date) missingFields.push("end_date")

    return NextResponse.json({
      success: true,
      contractId,
      contractNumber: contract.contract_number,
      hasWebhookUrl: hasWebhook,
      webhookUrlConfigured: hasWebhook ? "Yes" : "No - Add MAKE_CONTRACT_WEBHOOK_URL to .env.local",
      contractFound: true,
      missingFields,
      contractData: {
        number: contract.contract_number,
        status: contract.status,
        firstParty: contract.first_party?.name_en || "Missing",
        secondParty: contract.second_party?.name_en || "Missing",
        promoter: contract.promoter?.name_en || "Missing",
        startDate: contract.contract_start_date,
        endDate: contract.contract_end_date,
        pdfUrl: contract.pdf_url,
      },
    })
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
