import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Generate unique contract number
    const contractNumber = `CNT-${nanoid(8).toUpperCase()}`

    // Insert contract into database
    const { data: contract, error } = await supabase
      .from("contracts")
      .insert({
        contract_number: contractNumber,
        first_party_id: body.first_party_id,
        second_party_id: body.second_party_id,
        promoter_id: body.promoter_id,
        contract_name: body.contract_name,
        contract_type: body.contract_type,
        job_title: body.job_title,
        status: "generating",
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create contract" }, { status: 500 })
    }

    // Send to Make.com webhook for processing
    if (process.env.MAKE_WEBHOOK_URL) {
      try {
        await fetch(process.env.MAKE_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractId: contract.id,
            contractNumber,
            ...body,
          }),
        })
      } catch (webhookError) {
        console.error("Webhook error:", webhookError)
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({ success: true, contract })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractId, status, pdfUrl } = body
    const supabase = await createClient() // No arguments needed

    // Update contract status
    const { error } = await supabase
      .from("contracts")
      .update({
        status,
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update contract" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
