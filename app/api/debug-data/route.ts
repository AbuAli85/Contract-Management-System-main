import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Test auth
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        {
          error: "Auth error",
          details: sessionError.message,
          hasSession: false,
        },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        {
          error: "No session",
          hasSession: false,
        },
        { status: 401 }
      )
    }

    // Test parties query
    const { data: parties, error: partiesError } = await supabase
      .from("parties")
      .select("*")
      .limit(5)

    // Test promoters query
    const { data: promoters, error: promotersError } = await supabase
      .from("promoters")
      .select("*")
      .limit(5)

    // Test contracts query
    const { data: contracts, error: contractsError } = await supabase
      .from("contracts")
      .select(
        `
        *,
        first_party:parties!contracts_first_party_id_fkey(*),
        second_party:parties!contracts_second_party_id_fkey(*),
        promoter:promoters(*)
      `
      )
      .limit(5)

    return NextResponse.json({
      success: true,
      auth: {
        hasSession: true,
        userId: session.user.id,
        userEmail: session.user.email,
      },
      data: {
        parties: {
          count: parties?.length || 0,
          error: partiesError?.message,
          sample: parties?.[0] || null,
        },
        promoters: {
          count: promoters?.length || 0,
          error: promotersError?.message,
          sample: promoters?.[0] || null,
        },
        contracts: {
          count: contracts?.length || 0,
          error: contractsError?.message,
          sample: contracts?.[0] || null,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
