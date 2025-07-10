// Webhook Service - Centralized webhook management
export class WebhookService {
  // Use NEXT_PUBLIC_ prefixed variables for client-side access
  private static readonly MAIN_WEBHOOK_URL = 
    typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL 
      : (process.env.MAKE_WEBHOOK_URL || process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL)
      
  private static readonly SLACK_WEBHOOK_URL = 
    typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL 
      : (process.env.SLACK_WEBHOOK_URL || process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL)

  /**
   * Send contract data to main Make.com webhook for processing
   */
  static async sendToMainWebhook(contractData: any) {
    if (!this.MAIN_WEBHOOK_URL) {
      throw new Error('Main webhook URL not configured')
    }

    console.log('🔄 Sending to main webhook:', this.MAIN_WEBHOOK_URL)
    
    try {
      const response = await fetch(this.MAIN_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ContractGen-App/1.0',
        },
        body: JSON.stringify({
          ...contractData,
          timestamp: new Date().toISOString(),
          source: 'contract-app'
        })
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }

      // Try to parse as JSON, fallback to text if it fails
      let result
      const contentType = response.headers.get('content-type')
      const responseText = await response.text()
      
      try {
        result = JSON.parse(responseText)
      } catch {
        // If JSON parsing fails, treat as plain text response
        result = { status: 'accepted', message: responseText.trim() }
      }
      
      console.log('✅ Main webhook success:', result)
      return result
    } catch (error) {
      console.error('❌ Main webhook error:', error)
      throw error
    }
  }

  /**
   * Send PDF ready notification to Slack webhook
   */
  static async sendToSlackWebhook(pdfData: {
    contract_number: string
    pdf_url: string
    status?: string
    client_name?: string
    employer_name?: string
  }) {
    if (!this.SLACK_WEBHOOK_URL) {
      console.warn('⚠️ Slack webhook URL not configured, skipping notification')
      return null
    }

    console.log('📱 Sending to Slack webhook:', this.SLACK_WEBHOOK_URL)
    
    try {
      const response = await fetch(this.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ContractGen-App/1.0',
        },
        body: JSON.stringify({
          ...pdfData,
          timestamp: new Date().toISOString(),
          source: 'contract-app-pdf-ready'
        })
      })

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`)
      }

      // Try to parse as JSON, fallback to text if it fails
      let result
      const responseText = await response.text()
      
      try {
        result = JSON.parse(responseText)
      } catch {
        // If JSON parsing fails, treat as plain text response
        result = { status: 'accepted', message: responseText.trim() }
      }
      
      console.log('✅ Slack webhook success:', result)
      return result
    } catch (error) {
      console.error('❌ Slack webhook error:', error)
      // Don't throw - Slack notification failure shouldn't break the main flow
      return null
    }
  }

  /**
   * Process contract and trigger both webhooks in sequence
   */
  static async processContract(contractData: any) {
    try {
      // Step 1: Send to main webhook for processing
      const mainResult = await this.sendToMainWebhook(contractData)

      // Step 2: If main processing succeeds and we have a PDF URL, notify Slack
      if (mainResult?.pdf_url) {
        await this.sendToSlackWebhook({
          contract_number: contractData.contract_number || contractData.id,
          pdf_url: mainResult.pdf_url,
          status: mainResult.status || 'ready',
          client_name: contractData.client_name || contractData.second_party_name,
          employer_name: contractData.employer_name || contractData.first_party_name
        })
      }

      return mainResult
    } catch (error) {
      console.error('❌ Contract processing failed:', error)
      throw error
    }
  }

  /**
   * Test both webhooks
   */
  static async testWebhooks() {
    const testData = {
      contract_number: 'TEST-001',
      client_name: 'Test Client',
      employer_name: 'Test Employer',
      test_mode: true
    }

    console.log('🧪 Testing webhooks...')

    try {
      // Test main webhook
      console.log('Testing main webhook...')
      await this.sendToMainWebhook(testData)

      // Test Slack webhook
      console.log('Testing Slack webhook...')
      await this.sendToSlackWebhook({
        contract_number: 'TEST-001',
        pdf_url: 'https://example.com/test.pdf',
        status: 'test',
        client_name: 'Test Client',
        employer_name: 'Test Employer'
      })

      console.log('✅ All webhooks tested successfully')
      return { success: true, message: 'All webhooks working' }
    } catch (error) {
      console.error('❌ Webhook test failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}
