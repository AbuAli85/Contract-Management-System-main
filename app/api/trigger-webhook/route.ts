import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { contract_id } = await req.json()
  const hookUrl = process.env.MAKE_WEBHOOK_URL // _no_ NEXT_PUBLIC_ here

  if (!hookUrl) {
    console.error("MAKE_WEBHOOK_URL is not set in environment variables.")
    return NextResponse.json(
      { ok: false, error: "MAKE_WEBHOOK_URL is not set in environment variables." },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(hookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contract_id }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Make.com webhook returned error:", res.status, errorText)
      return NextResponse.json(
        { ok: false, error: `Make.com webhook error: ${res.status} - ${errorText}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Webhook failed:", err)
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    )
  }
}
