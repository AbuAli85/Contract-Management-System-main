import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL
  
  if (!makeWebhookUrl) {
    return NextResponse.json({ error: "MAKE_WEBHOOK_URL not configured" }, { status: 500 })
  }

  const testPayload = {
    contract_id: "test-contract-123",
    first_party_name: "Test Company A",
    second_party_name: "Test Company B", 
    promoter_name: "Test Promoter",
    start_date: "2025-01-01",
    end_date: "2026-01-01",
    job_title: "Software Engineer",
    email: "test@example.com"
  }

  try {
    console.log("Testing Make.com webhook with payload:", testPayload)
    
    const response = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    })

    const responseText = await response.text()
    const contentType = response.headers.get("content-type")
    
    console.log("Make.com response status:", response.status)
    console.log("Make.com response content-type:", contentType)
    console.log("Make.com response body:", responseText)

    return NextResponse.json({
      status: response.status,
      contentType,
      response: responseText,
      parsed: contentType?.includes("application/json") ? JSON.parse(responseText) : null
    })
  } catch (error) {
    console.error("Test webhook error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
