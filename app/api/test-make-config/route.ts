import { NextResponse } from "next/server"

export async function GET() {
  try {
    const webhookUrl = process.env.MAKE_CONTRACT_WEBHOOK_URL
    const hasWebhook = !!webhookUrl

    return NextResponse.json({
      success: true,
      config: {
        webhookConfigured: hasWebhook,
        webhookUrl: hasWebhook ? "***CONFIGURED***" : null,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "***CONFIGURED***" : null,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "***CONFIGURED***" : null,
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "***CONFIGURED***" : null,
      },
      requirements: {
        webhook: hasWebhook ? "✓ Configured" : "✗ Missing MAKE_CONTRACT_WEBHOOK_URL",
        supabase: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? "✓ Configured"
          : "✗ Missing Supabase config",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Configuration check failed" },
      { status: 500 }
    )
  }
}
