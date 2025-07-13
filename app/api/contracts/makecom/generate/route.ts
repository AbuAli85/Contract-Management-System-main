// app/api/contracts/makecom/generate/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Function to get Supabase client with runtime validation
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

// GET: Fetch a specific contract by ID
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get("id")

    if (!contractId) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 })
    }

    const { data: contract, error } = await supabase.from("contracts").select("*").eq("id", contractId).single()

    if (error) {
      console.error("Contract fetch error:", error)
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    return NextResponse.json({ contract })
  } catch (error) {
    console.error("Contract fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

// POST: Generate contract using Make.com templates
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    const body = await request.json()

    // Validate required fields
    const requiredFields = ["contract_type", "party_a_name", "party_b_name"]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 })
    }

    // Create contract record
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        contract_type: body.contract_type,
        party_a_name: body.party_a_name,
        party_b_name: body.party_b_name,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add other fields as needed
        contract_details: body.contract_details || {},
        terms: body.terms || [],
        payment_terms: body.payment_terms || {},
      })
      .select()
      .single()

    if (contractError) {
      console.error("Contract creation error:", contractError)
      return NextResponse.json({ error: "Failed to create contract" }, { status: 500 })
    }

    // Generate contract content (placeholder for now)
    const contractContent = `
      CONTRACT AGREEMENT
      
      Contract Type: ${body.contract_type}
      Party A: ${body.party_a_name}
      Party B: ${body.party_b_name}
      
      Date: ${new Date().toLocaleDateString()}
      
      [Contract content would be generated here based on template]
    `

    // Update contract with generated content
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        content: contractContent,
        status: "generated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", contract.id)

    if (updateError) {
      console.error("Contract update error:", updateError)
      return NextResponse.json({ error: "Failed to update contract with content" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      contract_id: contract.id,
      message: "Contract generated successfully",
    })
  } catch (error) {
    console.error("Contract generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

// Utility function to generate contract numbers
function generateContractNumber(): string {
  const prefix = "OMN"
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `${prefix}-${year}-${random}`
}
