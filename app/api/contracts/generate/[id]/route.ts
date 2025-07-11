import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { makeWebhook } from "@/lib/make-webhook-integration"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contractId = params.id

    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate contract data
    const validation = await makeWebhook.validateContractData(contractId)

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Contract data incomplete",
          missingFields: validation.missingFields,
        },
        { status: 400 }
      )
    }

    // Trigger generation via Make.com
    const result = await makeWebhook.generateContract(contractId)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Generation failed" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Contract generation started",
      pdf_url: result.pdf_url,
      contract_id: result.contract_id,
    })
  } catch (error) {
    console.error("Contract generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
