// app/api/contracts/makecom/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  generateContractWithMakecom,
  getEnhancedContractTypeConfig,
  getMakecomEnabledContractTypes
} from '@/lib/contract-type-config'
import { 
  getMakecomTemplateConfig,
  generateMakecomBlueprint
} from '@/lib/makecom-template-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: List all Make.com enabled contract types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const contractType = searchParams.get('type')

    if (action === 'types') {
      // Return all Make.com enabled contract types
      const makecomTypes = getMakecomEnabledContractTypes()
      return NextResponse.json({
        success: true,
        data: makecomTypes.map(type => ({
          id: type.id,
          name: type.name,
          description: type.description,
          category: type.category,
          makecomTemplateId: type.makecomTemplateId,
          requiredFields: type.requiredFields,
          businessRules: type.businessRules,
          omanCompliant: type.omanCompliant
        }))
      })
    }

    if (action === 'template' && contractType) {
      // Return template configuration for a specific contract type
      const contractConfig = getEnhancedContractTypeConfig(contractType)
      const templateConfig = contractConfig?.makecomTemplateId 
        ? getMakecomTemplateConfig(contractConfig.makecomTemplateId)
        : null

      if (!templateConfig) {
        return NextResponse.json({
          success: false,
          error: 'Template configuration not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: {
          contractConfig,
          templateConfig,
          googleDocsTemplateId: templateConfig.googleDocsTemplateId,
          templatePlaceholders: templateConfig.templatePlaceholders,
          makecomModuleConfig: templateConfig.makecomModuleConfig
        }
      })
    }

    if (action === 'blueprint' && contractType) {
      // Generate Make.com blueprint for a contract type
      const blueprint = generateMakecomBlueprint(contractType)
      
      if (!blueprint) {
        return NextResponse.json({
          success: false,
          error: 'Blueprint generation failed'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: blueprint
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action parameter'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Make.com API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST: Generate contract using Make.com templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractType, contractData, triggerMakecom = true } = body

    console.log('🔄 Make.com contract generation request:', { contractType, triggerMakecom })

    if (!contractType || !contractData) {
      return NextResponse.json({
        success: false,
        error: 'Contract type and data are required'
      }, { status: 400 })
    }

    // Generate contract with Make.com integration
    const { webhookPayload, templateConfig, validation } = generateContractWithMakecom(
      contractType,
      contractData
    )

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Contract validation failed',
        details: {
          errors: validation.errors,
          warnings: validation.warnings
        }
      }, { status: 400 })
    }

    // First, create the contract in the database
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        contract_number: contractData.contract_number || generateContractNumber(),
        first_party_id: contractData.first_party_id,
        second_party_id: contractData.second_party_id,
        promoter_id: contractData.promoter_id,
        contract_start_date: contractData.contract_start_date,
        contract_end_date: contractData.contract_end_date,
        job_title: contractData.job_title,
        work_location: contractData.work_location,
        basic_salary: contractData.basic_salary,
        allowances: contractData.allowances,
        currency: contractData.currency || 'OMR',
        contract_type: contractType,
        status: 'pending_generation',
        email: contractData.email,
        special_terms: contractData.special_terms,
        is_current: true
      })
      .select()
      .single()

    if (contractError) {
      console.error('❌ Contract creation error:', contractError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create contract',
        details: contractError
      }, { status: 500 })
    }

    console.log('✅ Contract created:', contract.id)

    // If triggerMakecom is true, send webhook to Make.com
    let makecomResponse = null
    if (triggerMakecom && webhookPayload) {
      try {
        // Add the created contract ID to the webhook payload
        const enhancedPayload = {
          ...webhookPayload,
          contract_id: contract.id,
          contract_number: contract.contract_number
        }

        // Trigger Make.com webhook (replace with your actual Make.com webhook URL)
        const makecomWebhookUrl = process.env.MAKECOM_WEBHOOK_URL
        
        if (makecomWebhookUrl) {
          const response = await fetch(makecomWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(enhancedPayload)
          })

          makecomResponse = {
            status: response.status,
            success: response.ok,
            timestamp: new Date().toISOString()
          }

          if (response.ok) {
            console.log('✅ Make.com webhook triggered successfully')
            
            // Update contract status
            await supabase
              .from('contracts')
              .update({ status: 'processing' })
              .eq('id', contract.id)
          } else {
            console.error('❌ Make.com webhook failed:', response.statusText)
          }
        } else {
          console.warn('⚠️ MAKECOM_WEBHOOK_URL not configured')
        }
      } catch (makecomError) {
        console.error('❌ Make.com webhook error:', makecomError)
        makecomResponse = {
          status: 500,
          success: false,
          error: makecomError instanceof Error ? makecomError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        contract,
        validation,
        templateConfig: templateConfig ? {
          id: templateConfig.id,
          name: templateConfig.name,
          googleDocsTemplateId: templateConfig.googleDocsTemplateId
        } : null,
        makecom: {
          triggered: triggerMakecom,
          webhookPayload: triggerMakecom ? webhookPayload : null,
          response: makecomResponse
        }
      }
    })

  } catch (error) {
    console.error('❌ Contract generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Contract generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Utility function to generate contract numbers
function generateContractNumber(): string {
  const prefix = 'OMN'
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${year}-${random}`
}
