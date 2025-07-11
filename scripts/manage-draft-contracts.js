const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function analyzeDraftContracts() {
  console.log("🔍 Analyzing Draft Contracts\n")

  try {
    // Fetch all draft contracts
    const { data: contracts, error } = await supabase
      .from("contracts")
      .select(
        `
        id,
        contract_number,
        status,
        created_at,
        pdf_url,
        first_party_id,
        second_party_id,
        promoter_id,
        contract_start_date,
        contract_end_date
      `
      )
      .eq("status", "draft")
      .order("created_at", { ascending: false })

    if (error) throw error

    console.log(`Found ${contracts.length} draft contracts\n`)

    // Group by date
    const contractsByDate = {}
    contracts.forEach((contract) => {
      const date = new Date(contract.created_at).toLocaleDateString()
      if (!contractsByDate[date]) {
        contractsByDate[date] = []
      }
      contractsByDate[date].push(contract)
    })

    // Display summary
    console.log("📊 Summary by Date:")
    Object.entries(contractsByDate).forEach(([date, contracts]) => {
      console.log(`  ${date}: ${contracts.length} contracts`)
    })

    // Check for missing data
    console.log("\n⚠️  Contracts with Missing Data:")
    let missingDataCount = 0

    contracts.forEach((contract) => {
      const missing = []
      if (!contract.first_party_id) missing.push("first_party")
      if (!contract.second_party_id) missing.push("second_party")
      if (!contract.promoter_id) missing.push("promoter")
      if (!contract.contract_start_date) missing.push("start_date")
      if (!contract.contract_end_date) missing.push("end_date")

      if (missing.length > 0) {
        console.log(`  ${contract.contract_number}: Missing ${missing.join(", ")}`)
        missingDataCount++
      }
    })

    if (missingDataCount === 0) {
      console.log("  ✅ All contracts have required data")
    }

    // Recent contracts
    console.log("\n📅 Most Recent Draft Contracts:")
    contracts.slice(0, 5).forEach((contract) => {
      const created = new Date(contract.created_at)
      console.log(`  ${contract.contract_number} - Created: ${created.toLocaleString()}`)
    })

    return contracts
  } catch (error) {
    console.error("❌ Error:", error.message)
    return []
  }
}

async function generateDocumentForContract(contractNumber) {
  console.log(`\n📄 Generating document for ${contractNumber}...`)

  try {
    // First, get the contract details
    const { data: contract, error: fetchError } = await supabase
      .from("contracts")
      .select(
        `
        *,
        first_party:parties!contracts_first_party_id_fkey(*),
        second_party:parties!contracts_second_party_id_fkey(*),
        promoter:promoters(*)
      `
      )
      .eq("contract_number", contractNumber)
      .single()

    if (fetchError) throw fetchError

    if (!contract) {
      console.log("❌ Contract not found")
      return
    }

    // Check if Make.com webhook is configured
    const webhookUrl = process.env.MAKE_CONTRACT_WEBHOOK_URL
    if (!webhookUrl) {
      console.log("❌ Make.com webhook URL not configured")
      console.log("   Add MAKE_CONTRACT_WEBHOOK_URL to your .env.local file")
      return
    }

    // Prepare webhook payload
    const payload = {
      contract_id: contract.id,
      contract_number: contract.contract_number,
      first_party_name_en: contract.first_party.name_en,
      first_party_name_ar: contract.first_party.name_ar || "",
      first_party_crn: contract.first_party.crn || "",
      second_party_name_en: contract.second_party.name_en,
      second_party_name_ar: contract.second_party.name_ar || "",
      second_party_crn: contract.second_party.crn || "",
      promoter_name_en: contract.promoter.name_en,
      promoter_name_ar: contract.promoter.name_ar || "",
      job_title: contract.job_title || "",
      work_location: contract.work_location || "",
      email: contract.promoter.email || "",
      start_date: contract.contract_start_date,
      end_date: contract.contract_end_date,
      id_card_number: contract.promoter.id_card_number || "",
      promoter_id_card_url: contract.promoter.id_card_url || "",
      promoter_passport_url: contract.promoter.passport_url || "",
    }

    console.log("📤 Sending to Make.com...")

    // Send to Make.com
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`)
    }

    const result = await response.json()
    console.log("✅ Document generation triggered successfully")

    if (result.pdf_url) {
      console.log(`📎 PDF URL: ${result.pdf_url}`)
    }

    return result
  } catch (error) {
    console.error("❌ Error:", error.message)
    return null
  }
}

async function bulkGenerateDocuments(limit = 5) {
  console.log(`\n🚀 Bulk Document Generation (Limit: ${limit})\n`)

  const contracts = await analyzeDraftContracts()
  const contractsToProcess = contracts.slice(0, limit)

  if (contractsToProcess.length === 0) {
    console.log("No contracts to process")
    return
  }

  console.log(`\nProcessing ${contractsToProcess.length} contracts...\n`)

  for (const contract of contractsToProcess) {
    await generateDocumentForContract(contract.contract_number)

    // Wait 2 seconds between requests to avoid overwhelming Make.com
    if (contractsToProcess.indexOf(contract) < contractsToProcess.length - 1) {
      console.log("\n⏳ Waiting 2 seconds before next request...")
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  console.log("\n✅ Bulk generation complete!")
}

// Command line interface
const command = process.argv[2]
const param = process.argv[3]

switch (command) {
  case "analyze":
    analyzeDraftContracts()
    break

  case "generate":
    if (!param) {
      console.log("❌ Please provide a contract number")
      console.log("Usage: node manage-draft-contracts.js generate PAC-XXXXX")
    } else {
      generateDocumentForContract(param)
    }
    break

  case "bulk":
    const limit = param ? parseInt(param) : 5
    bulkGenerateDocuments(limit)
    break

  default:
    console.log("📋 Draft Contract Management Tool\n")
    console.log("Commands:")
    console.log("  analyze                    - Analyze all draft contracts")
    console.log("  generate <contract_number> - Generate document for specific contract")
    console.log(
      "  bulk [limit]              - Generate documents for multiple contracts (default: 5)"
    )
    console.log("\nExamples:")
    console.log("  node manage-draft-contracts.js analyze")
    console.log("  node manage-draft-contracts.js generate PAC-10072025-200")
    console.log("  node manage-draft-contracts.js bulk 10")
}
