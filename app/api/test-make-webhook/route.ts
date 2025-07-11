import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const webhookUrl = process.env.MAKE_CONTRACT_WEBHOOK_URL

    if (!webhookUrl) {
      return NextResponse.json({ error: "Make.com webhook URL not configured" }, { status: 400 })
    }

    // Test payload
    const testPayload = {
      contract_id: "test-" + Date.now(),
      contract_number: "TEST-" + new Date().toISOString().split("T")[0].replace(/-/g, ""),
      first_party_name_en: "Test Company A",
      first_party_name_ar: "شركة اختبار أ",
      first_party_crn: "TEST123456",
      second_party_name_en: "Test Company B",
      second_party_name_ar: "شركة اختبار ب",
      second_party_crn: "TEST654321",
      promoter_name_en: "Test Promoter",
      promoter_name_ar: "مروج اختبار",
      job_title: "Test Position",
      work_location: "Test Location",
      email: "test@example.com",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      id_card_number: "TEST1234567890",
      promoter_id_card_url: "",
      promoter_passport_url: "",
    }

    console.log("Sending test webhook to:", webhookUrl)
    console.log("Test payload:", testPayload)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseData,
      testPayload,
      webhookUrl: webhookUrl.replace(
        /https:\/\/hook\..*?\.make\.com\//,
        "https://hook.***.make.com/"
      ),
    })
  } catch (error) {
    console.error("Webhook test error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook test failed",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
