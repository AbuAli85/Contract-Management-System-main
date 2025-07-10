import { NextResponse } from 'next/server'
import { WebhookService } from '@/lib/webhook-service'

export async function GET() {
  try {
    // Get environment variables on the server side
    const mainWebhookUrl = process.env.MAKE_WEBHOOK_URL || process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL
    
    console.log('🧪 Testing webhooks...')
    console.log('Main webhook URL:', mainWebhookUrl ? 'Configured ✅' : 'Not configured ❌')
    console.log('Slack webhook URL:', slackWebhookUrl ? 'Configured ✅' : 'Not configured ❌')
    
    const results: {
      mainWebhook: { configured: boolean; tested: boolean; error: string | null };
      slackWebhook: { configured: boolean; tested: boolean; error: string | null };
    } = {
      mainWebhook: { configured: false, tested: false, error: null },
      slackWebhook: { configured: false, tested: false, error: null }
    }
    
    // Test main webhook
    if (mainWebhookUrl) {
      results.mainWebhook.configured = true
      try {
        const response = await fetch(mainWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contract_number: 'TEST-001',
            client_name: 'Test Client',
            employer_name: 'Test Employer',
            test_mode: true,
            timestamp: new Date().toISOString()
          })
        })
        
        if (response.ok) {
          results.mainWebhook.tested = true
          console.log('✅ Main webhook test successful')
        } else {
          results.mainWebhook.error = `HTTP ${response.status}: ${response.statusText}`
          console.log('❌ Main webhook test failed:', response.status)
        }
      } catch (error) {
        results.mainWebhook.error = error instanceof Error ? error.message : 'Network error'
        console.log('❌ Main webhook error:', error)
      }
    } else {
      results.mainWebhook.error = 'MAKE_WEBHOOK_URL not configured'
    }
    
    // Test Slack webhook
    if (slackWebhookUrl) {
      results.slackWebhook.configured = true
      try {
        const response = await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contract_number: 'TEST-001',
            pdf_url: 'https://example.com/test.pdf',
            status: 'test',
            client_name: 'Test Client',
            employer_name: 'Test Employer',
            test_mode: true,
            timestamp: new Date().toISOString()
          })
        })
        
        if (response.ok) {
          results.slackWebhook.tested = true
          console.log('✅ Slack webhook test successful')
        } else {
          results.slackWebhook.error = `HTTP ${response.status}: ${response.statusText}`
          console.log('❌ Slack webhook test failed:', response.status)
        }
      } catch (error) {
        results.slackWebhook.error = error instanceof Error ? error.message : 'Network error'
        console.log('❌ Slack webhook error:', error)
      }
    } else {
      results.slackWebhook.error = 'SLACK_WEBHOOK_URL not configured'
    }
    
    const allSuccess = results.mainWebhook.tested && results.slackWebhook.tested
    
    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? 'All webhooks tested successfully' : 'Some webhooks failed',
      results,
      webhooks: {
        main: mainWebhookUrl || 'Not configured',
        slack: slackWebhookUrl || 'Not configured'
      }
    })
  } catch (error) {
    console.error('Webhook test API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test webhooks',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (data.type === 'main') {
      const result = await WebhookService.sendToMainWebhook(data.payload)
      return NextResponse.json({ success: true, result })
    } else if (data.type === 'slack') {
      const result = await WebhookService.sendToSlackWebhook(data.payload)
      return NextResponse.json({ success: true, result })
    } else if (data.type === 'process') {
      const result = await WebhookService.processContract(data.payload)
      return NextResponse.json({ success: true, result })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook type. Use: main, slack, or process' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Webhook API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
