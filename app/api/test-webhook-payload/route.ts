import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Sample payload structure that matches Make.com expectations
    const samplePayload = {
      contract_id: "550e8400-e29b-41d4-a716-446655440000",
      contract_number: "PAC-10072025-200",
      first_party_name_en: "Falcon Eye Group",
      first_party_name_ar: "مجموعة عين الصقر",
      first_party_crn: "1234567890",
      second_party_name_en: "Tech Solutions Ltd",
      second_party_name_ar: "شركة الحلول التقنية",
      second_party_crn: "0987654321",
      promoter_name_en: "John Doe",
      promoter_name_ar: "جون دو",
      job_title: "Software Developer",
      work_location: "Riyadh, Saudi Arabia",
      email: "john.doe@example.com",
      start_date: "2025-01-01T00:00:00.000Z",
      end_date: "2025-12-31T23:59:59.999Z",
      id_card_number: "1234567890",
      promoter_id_card_url: "https://example.com/id-card.jpg",
      promoter_passport_url: "https://example.com/passport.jpg",
    }

    const fieldDescriptions = {
      contract_id: "UUID of the contract record",
      contract_number: "Unique contract number (e.g., PAC-DDMMYYYY-XXX)",
      first_party_name_en: "First party name in English",
      first_party_name_ar: "First party name in Arabic",
      first_party_crn: "First party Commercial Registration Number",
      second_party_name_en: "Second party name in English",
      second_party_name_ar: "Second party name in Arabic",
      second_party_crn: "Second party Commercial Registration Number",
      promoter_name_en: "Promoter name in English (optional for some templates)",
      promoter_name_ar: "Promoter name in Arabic",
      job_title: "Job title for employment contracts",
      work_location: "Work location for employment contracts",
      email: "Promoter email address",
      start_date: "Contract start date (ISO 8601 format)",
      end_date: "Contract end date (ISO 8601 format)",
      id_card_number: "Promoter ID card number",
      promoter_id_card_url: "URL to promoter ID card image",
      promoter_passport_url: "URL to promoter passport image",
    }

    return NextResponse.json({
      success: true,
      samplePayload,
      fieldDescriptions,
      notes: [
        "All text fields accept empty strings if data is not available",
        "Promoter fields can be empty for Partnership Agreements",
        "Dates must be in ISO 8601 format",
        "Image URLs should be publicly accessible or have authentication tokens",
      ],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payload generation failed" },
      { status: 500 }
    )
  }
}
