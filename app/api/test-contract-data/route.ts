import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get a sample contract with all relations
    const { data: contracts, error } = await supabase
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
      .order("created_at", { ascending: false })

    if (error) throw error

    // Analyze contracts
    const analysis = contracts?.map((contract) => ({
      contract_number: contract.contract_number,
      status: contract.status,
      has_first_party: !!contract.first_party,
      has_second_party: !!contract.second_party,
      has_promoter: !!contract.promoter,
      has_dates: !!(contract.contract_start_date && contract.contract_end_date),
      template_name: contract.metadata?.template_name || "No template",
      missing_fields: [
        !contract.first_party && "first_party",
        !contract.second_party && "second_party",
        !contract.contract_start_date && "start_date",
        !contract.contract_end_date && "end_date",
        // Promoter is optional for some templates
        contract.metadata?.template_name !== "Partnership Agreement" &&
          !contract.promoter &&
          "promoter",
      ].filter(Boolean),
    }))

    const summary = {
      total_contracts: contracts?.length || 0,
      ready_for_generation: analysis?.filter((c) => c.missing_fields.length === 0).length || 0,
      missing_data: analysis?.filter((c) => c.missing_fields.length > 0).length || 0,
    }

    return NextResponse.json({
      success: true,
      summary,
      contracts: analysis,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Data check failed" },
      { status: 500 }
    )
  }
}
