import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { contract_number } = await request.json()
    
    console.log('🔄 Webhook received contract_number:', contract_number)

    if (!contract_number) {
      return NextResponse.json({ error: 'Contract number is required' }, { status: 400 })
    }

    // Get the contract with related data
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        *,
        client_company:companies!contracts_client_company_id_fkey(*),
        employer_company:companies!contracts_employer_company_id_fkey(*),
        promoter:promoters(*)
      `)
      .eq('contract_number', contract_number)
      .eq('is_current', true)

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!contracts?.length) {
      console.log('❌ Contract not found:', contract_number)
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const contract = contracts[0]
    console.log('✅ Contract found:', contract.id)

    // 🔄 PARTY ROLE DEFINITIONS
    // PARTY A (first_party) = CLIENT 
    // PARTY B (second_party) = EMPLOYER
    const webhookData = {
      contract_id: contract.id,
      contract_number: contract.contract_number,
      
      // � PARTY A = CLIENT COMPANY
      first_party_name_en: contract.client_company?.name_en || '',
      first_party_name_ar: contract.client_company?.name_ar || '',
      first_party_crn: contract.client_company?.crn || '',
      
      // � PARTY B = EMPLOYER COMPANY
      second_party_name_en: contract.employer_company?.name_en || '',
      second_party_name_ar: contract.employer_company?.name_ar || '',
      second_party_crn: contract.employer_company?.crn || '',
      
      // 👤 PROMOTER DETAILS (Unchanged)
      promoter_name_en: contract.promoter?.name_en || '',
      promoter_name_ar: contract.promoter?.name_ar || '',
      job_title: contract.job_title || '',
      work_location: contract.work_location || '',
      email: contract.promoter?.email || '',
      id_card_number: contract.promoter?.id_card_number || '',
      
      // 📅 CONTRACT DATES
      start_date: contract.start_date,
      end_date: contract.end_date,
      
      // 🖼️ IMAGE URLS WITH FALLBACKS
      promoter_id_card_url: contract.promoter?.id_card_url || 
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop&auto=format',
      promoter_passport_url: contract.promoter?.passport_url || 
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format',
      
      pdf_url: null
    }

    console.log('🔄 Party roles swapped successfully:', {
      contract_id: webhookData.contract_id,
      first_party_employer: webhookData.first_party_name_en,
      second_party_client: webhookData.second_party_name_en,
      promoter: webhookData.promoter_name_en
    })

    return NextResponse.json(webhookData)
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle GET requests for webhook verification
export async function GET(request: Request) {
  return NextResponse.json(
    { 
      message: "Make.com webhook endpoint is active",
      timestamp: new Date().toISOString(),
      version: "1.0"
    },
    { status: 200 }
  )
}

// Handle PATCH requests for PDF ready updates
export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    console.log('📄 PDF ready webhook received:', data)

    const { contract_number, pdf_url, status } = data

    if (!contract_number || !pdf_url) {
      return NextResponse.json({ 
        error: 'contract_number and pdf_url are required' 
      }, { status: 400 })
    }

    // Update contract with PDF URL
    const { data: updateResult, error: updateError } = await supabase
      .from('contracts')
      .update({ 
        pdf_url,
        status: status || 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('contract_number', contract_number)
      .select()

    if (updateError) {
      console.error('❌ Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
    }

    console.log('✅ Contract updated with PDF URL')

    // Trigger Slack notification
    try {
      const { WebhookService } = await import('@/lib/webhook-service')
      await WebhookService.sendToSlackWebhook({
        contract_number,
        pdf_url,
        status: status || 'ready',
        client_name: data.client_name || 'N/A',
        employer_name: data.employer_name || 'N/A'
      })
      console.log('✅ Slack notification sent')
    } catch (slackError) {
      console.error('❌ Slack notification failed:', slackError)
      // Don't fail the main response
    }

    return NextResponse.json({
      success: true,
      message: 'Contract updated and Slack notified',
      contract_number,
      pdf_url
    })

  } catch (error) {
    console.error('❌ PATCH webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
