import { type NextRequest, NextResponse } from "next/server"
// Import the lazy-initialized admin client
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { createServerComponentClient } from "@/lib/supabaseServer"
import { contractGeneratorSchema } from "@/lib/schema-generator" // Your Zod schema for validation
import type { BilingualPdfData } from "@/lib/types"
import type { Database } from "@/types/supabase"
import { format } from "date-fns"

// Placeholder for your PDF generation logic (e.g., calling Google Docs API via Make.com)
async function generateBilingualPdf(
  contractData: BilingualPdfData,
  contractId: string,
): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin() // Get client instance
  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL
  if (!makeWebhookUrl) {
    console.error("Make.com webhook URL (MAKE_WEBHOOK_URL) is not configured.")
    return null
  }

  // Add retry mechanism for webhook calls
  const maxRetries = 3
  const retryDelay = 1000 // 1 second

  // Send all relevant fields to Make.com
  const payloadForMake = {
    contract_id: contractId,
    first_party_name_en: contractData.first_party_name_en,
    first_party_name_ar: contractData.first_party_name_ar,
    first_party_crn: contractData.first_party_crn,
    second_party_name_en: contractData.second_party_name_en,
    second_party_name_ar: contractData.second_party_name_ar,
    second_party_crn: contractData.second_party_crn,
    promoter_name_en: contractData.promoter_name_en,
    promoter_name_ar: contractData.promoter_name_ar,
    job_title: contractData.job_title || "",
    work_location: contractData.work_location || "",
    email: contractData.email,
    start_date: contractData.contract_start_date,
    end_date: contractData.contract_end_date,
    contract_number: contractData.contract_number,
    id_card_number: contractData.id_card_number,
    promoter_id_card_url: contractData.promoter_id_card_url,
    promoter_passport_url: contractData.promoter_passport_url,
    pdf_url: contractData.pdf_url,
    // Add more fields as needed
  }

  // Retry loop for webhook calls
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Triggering Make.com webhook (attempt ${attempt}/${maxRetries}) with payload:`, payloadForMake)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Webhook-Secret": process.env.MAKE_WEBHOOK_SECRET || "",
          "User-Agent": "Contract-Generator-App/1.0",
          "X-Trigger-Source": "contract-generator",
          "X-Contract-ID": contractId,
          "X-Timestamp": new Date().toISOString()
        },
        body: JSON.stringify(payloadForMake),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`Make.com webhook failed (attempt ${attempt}): ${response.status} ${response.statusText}`)
        if (attempt === maxRetries) {
          return null
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        continue
      }

      const responseText = await response.text()
      console.log(`Make.com response (attempt ${attempt}):`, responseText)

      // Try to parse as JSON first
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        // If it's not JSON, check if it's a simple success message
        if (responseText.trim().toLowerCase() === "accepted") {
          console.log("✓ Make.com returned 'Accepted' - treating as success")
          return "accepted" // Special case for simple acceptance
        }
        // Only log as error if it's not a recognized success message
        console.error("Failed to parse Make.com response as JSON and not a recognized success message:", parseError)
        console.error("Response text was:", responseText)
        if (attempt === maxRetries) {
          return null
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        continue
      }

      // Extract PDF URL from JSON response
      const pdfUrl = responseData.pdf_url || responseData.url || responseData.download_url || responseData.file_url
      
      if (pdfUrl) {
        console.log("✓ PDF URL extracted from Make.com response:", pdfUrl)
        return pdfUrl
      } else if (responseData.success) {
        console.log("✓ Make.com reported success but no PDF URL found")
        return "success" // Special case for success without URL
      } else {
        console.error("Make.com response doesn't contain PDF URL or success status")
        if (attempt === maxRetries) {
          return null
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        continue
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`Make.com webhook timeout (attempt ${attempt}): Request took too long`)
        } else {
          console.error(`Error calling Make.com webhook (attempt ${attempt}):`, error.message)
        }
      } else {
        console.error(`Unknown error calling Make.com webhook (attempt ${attempt}):`, error)
      }
      
      if (attempt === maxRetries) {
        return null
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== CONTRACT API ROUTE START ===")
    const supabase = await createServerComponentClient()
    let supabaseAdmin
    try {
      supabaseAdmin = getSupabaseAdmin()
    } catch (adminError) {
      console.error("✗ Supabase admin client error:", adminError)
      return NextResponse.json(
        { message: "Server configuration error", error: "Failed to initialize Supabase admin client", details: adminError instanceof Error ? adminError.message : String(adminError) },
        { status: 500 },
      )
    }
    const body = await request.json()
    console.log("Received contract data:", JSON.stringify(body, null, 2))

    // Validate required fields
    const requiredIds = ['first_party_id', 'second_party_id', 'promoter_id']
    const missingIds = requiredIds.filter(id => !body[id])
    
    if (missingIds.length > 0) {
      console.error("Missing required IDs:", missingIds)
      return NextResponse.json(
        { message: "Missing required fields", error: `Missing required IDs: ${missingIds.join(', ')}` },
        { status: 400 },
      )
    }

    // Flatten the nested payload
    // Note: first_party = Client, second_party = Employer (updated schema)
    const contractToInsert: Database["public"]["Tables"]["contracts"]["Insert"] = {
      // Handle both nested and flat ID formats
      // first_party = Client
      first_party_id: body.first_party?.id || body.first_party_id,
      // second_party = Employer
      second_party_id: body.second_party?.id || body.second_party_id,
      promoter_id: body.promoter?.id || body.promoter_id,
      contract_start_date: body.contract_start_date,
      contract_end_date: body.contract_end_date,
      job_title: body.job_title,
      work_location: body.work_location,
      email: body.email,
      contract_value: body.contract_value ? parseFloat(body.contract_value.toString()) : null,
      status: body.status || 'draft',
      // contract_number will be auto-generated by the trigger
    }
    console.log("Contract to insert:", JSON.stringify(contractToInsert, null, 2))

    const { data: newContract, error: insertError } = await supabase
      .from("contracts")
      .insert(contractToInsert)
      .select()
      .single()

    if (insertError) {
      console.error("Supabase insert error:", insertError)
      return NextResponse.json(
        { message: "Failed to create contract", error: insertError.message },
        { status: 500 },
      )
    }
    if (!newContract) {
      return NextResponse.json(
        { message: "Failed to create contract, no data returned after insert." },
        { status: 500 },
      )
    }
    console.log("✓ Contract created:", newContract.id)

    // Fetch party and promoter details with better error handling
    console.log("Fetching party and promoter details...")
    console.log("Party A (Client) ID:", newContract.first_party_id)
    console.log("Party B (Employer) ID:", newContract.second_party_id)
    console.log("Promoter ID:", newContract.promoter_id)

    // Only fetch data if IDs are present
    const [clientParty, employerParty, promoterDetails] = await Promise.all([
      newContract.first_party_id ? 
        supabase
          .from("parties")
          .select("name_en, name_ar, crn")
          .eq("id", newContract.first_party_id)
          .single() :
        Promise.resolve({ data: null, error: null }),
      newContract.second_party_id ?
        supabase
          .from("parties")
          .select("name_en, name_ar, crn")
          .eq("id", newContract.second_party_id)
          .single() :
        Promise.resolve({ data: null, error: null }),
      newContract.promoter_id ?
        supabase
          .from("promoters")
          .select("name_en, name_ar, id_card_number, id_card_url, passport_url")
          .eq("id", newContract.promoter_id)
          .single() :
        Promise.resolve({ data: null, error: null }),
    ])

    // Log the results of each query
    console.log("Client party result:", { data: clientParty.data, error: clientParty.error })
    console.log("Employer party result:", { data: employerParty.data, error: employerParty.error })
    console.log("Promoter result:", { data: promoterDetails.data, error: promoterDetails.error })

    // Check for errors in data fetching
    if (clientParty.error) {
      console.error("Error fetching client party:", clientParty.error)
    }
    if (employerParty.error) {
      console.error("Error fetching employer party:", employerParty.error)
    }
    if (promoterDetails.error) {
      console.error("Error fetching promoter:", promoterDetails.error)
    }

    // Warn if IDs are missing
    if (!newContract.first_party_id) {
      console.warn("⚠️ Party A (Client) ID is missing from contract")
    }
    if (!newContract.second_party_id) {
      console.warn("⚠️ Second Party (Employer) ID is missing from contract")
    }
    if (!newContract.promoter_id) {
      console.warn("⚠️ Promoter ID is missing from contract")
    }

    console.log("✓ Party and promoter details fetched")

    // Prepare PDF data with correct party roles
    // first_party = Client, second_party = Employer (updated schema)
    const pdfData: BilingualPdfData = {
      first_party_name_en: clientParty.data?.name_en, // Client
      first_party_name_ar: clientParty.data?.name_ar, // Client
      first_party_crn: clientParty.data?.crn, // Client
      second_party_name_en: employerParty.data?.name_en, // Employer
      second_party_name_ar: employerParty.data?.name_ar, // Employer
      second_party_crn: employerParty.data?.crn, // Employer
      promoter_name_en: promoterDetails.data?.name_en,
      promoter_name_ar: promoterDetails.data?.name_ar,
      id_card_number: promoterDetails.data?.id_card_number,
      promoter_id_card_url: promoterDetails.data?.id_card_url,
      promoter_passport_url: promoterDetails.data?.passport_url,
      job_title: newContract.job_title,
      work_location: newContract.work_location,
      email: newContract.email ?? null,
      contract_start_date: newContract.contract_start_date ?? null,
      contract_end_date: newContract.contract_end_date ?? null,
      contract_number: newContract.contract_number,
      pdf_url: newContract.pdf_url,
    }

    console.log("PDF data prepared:", JSON.stringify(pdfData, null, 2))

    // Validate that we have the required data for Make.com
    const requiredFields = [
      'first_party_name_en', 'first_party_name_ar', 'first_party_crn', // Client
      'second_party_name_en', 'second_party_name_ar', 'second_party_crn', // Employer
      'promoter_name_en', 'promoter_name_ar', 'email', 'contract_number'
    ]
    
    const missingFields = requiredFields.filter(field => !pdfData[field as keyof BilingualPdfData])
    if (missingFields.length > 0) {
      console.warn("⚠️ Missing required fields for Make.com webhook:", missingFields)
      console.warn("This may cause issues with PDF generation")
    }

    const pdfUrl = await generateBilingualPdf(pdfData, newContract.id)
    console.log("✓ PDF generation completed:", pdfUrl ? "Success" : "Failed")

    let finalContractData = newContract
    if (pdfUrl && pdfUrl !== "accepted" && pdfUrl !== "success") {
      // Only update if we have a real PDF URL, not just success indicators
      try {
        const { data: updatedContractWithPdf, error: updateError } = await supabase
          .from("contracts")
          .update({ pdf_url: pdfUrl })
          .eq("id", newContract.id)
          .select()
          .single()

        if (updateError) {
          console.error("Supabase update error (pdf_url):", updateError)
          if (updateError.code === 'PGRST116') {
            console.warn("⚠️ Contract not found during PDF URL update - it may have been deleted or modified")
          }
          // Don't fail the entire request if PDF URL update fails
          // The contract was created successfully, just without PDF URL
        } else if (updatedContractWithPdf) {
          finalContractData = updatedContractWithPdf
          console.log("✓ PDF URL updated successfully")
        }
      } catch (updateError) {
        console.error("Unexpected error updating contract with PDF URL:", updateError)
        // Continue with the original contract data
      }
    } else if (pdfUrl === "accepted" || pdfUrl === "success") {
      console.log("✓ Make.com webhook accepted - PDF will be generated asynchronously")
    }

    console.log("=== CONTRACT API ROUTE SUCCESS ===")
    return NextResponse.json(
      { message: "Contract created successfully!", contract: finalContractData },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("=== CONTRACT API ROUTE ERROR ===")
    console.error("API Route Error:", error)
    return NextResponse.json(
      { message: "Internal server error", error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
      { status: 500 },
    )
  }
}
