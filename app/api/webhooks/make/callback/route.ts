import { NextRequest, NextResponse } from "next/server"
import { makeIntegration } from "@/lib/make-integration"
import { createClient } from "@/lib/supabase/server"

// Make.com webhook callback handler
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity
    const apiKey = request.headers.get("X-API-Key")
    if (apiKey !== process.env.MAKE_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.contractId || !data.status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle the callback
    await makeIntegration.handleCallback(data)

    // Log the event
    const supabase = createClient()
    await supabase.from("webhook_logs").insert({
      source: "make.com",
      event_type: "document_generation",
      contract_id: data.contractId,
      status: data.status,
      payload: data,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Callback processed successfully",
    })
  } catch (error) {
    console.error("Make.com callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
