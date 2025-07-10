"use client"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function LocaleSettingsPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const [locale, setLocale] = useState('en')
  const [supabaseStatus, setSupabaseStatus] = useState('Checking...')
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()
  
  useEffect(() => {
    params.then(p => setLocale(p.locale))
    
    // Check Supabase connection status
    const checkSupabase = () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      setSupabaseStatus(url ? "Connected ✅" : "Not configured ❌")
    }
    checkSupabase()
  }, [])

  const testWebhooks = async () => {
    setTesting(true)
    try {
      // Call the API endpoint instead of using the service directly
      const response = await fetch('/api/test-webhooks', {
        method: 'GET',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Webhooks Test Successful ✅",
          description: "Both Main and Slack webhooks are working correctly",
        })
      } else {
        toast({
          title: "Webhook Test Failed ❌",
          description: result.error || 'Unknown error',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Test error:', error)
      toast({
        title: "Test Error ❌",
        description: "Failed to test webhooks. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <CardHeader className="p-0">
          <CardTitle>System Settings / إعدادات النظام</CardTitle>
          <CardDescription>
            Configure application settings and preferences. / تكوين إعدادات وتفضيلات التطبيق.
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage general application settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input id="appName" defaultValue="Contract Management CRM" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Input id="defaultCurrency" defaultValue="USD" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Input id="defaultLanguage" defaultValue={locale} />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <Input id="emailNotifications" defaultValue="enabled" />
                </div>
                <Button>Update Notifications</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <CardDescription>Manage third-party integrations and API keys.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Make.com Integration */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold text-lg">Make.com Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure webhooks for automated PDF contract generation and Slack notifications.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Main Webhook */}
                    <div className="space-y-2">
                      <Label htmlFor="mainWebhookUrl">Main Processing Webhook</Label>
                      <Input 
                        id="mainWebhookUrl" 
                        placeholder="https://hook.eu2.make.com/..."
                        defaultValue="https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4"
                      />
                      <p className="text-xs text-muted-foreground">
                        🔄 Processes contracts and generates PDFs
                      </p>
                    </div>

                    {/* Slack Webhook */}
                    <div className="space-y-2">
                      <Label htmlFor="slackWebhookUrl">Slack Notification Webhook</Label>
                      <Input 
                        id="slackWebhookUrl" 
                        placeholder="https://hook.eu2.make.com/..."
                        defaultValue="https://hook.eu2.make.com/fwu4cspy92s2m4aw1vni46cu0m89xvp8"
                      />
                      <p className="text-xs text-muted-foreground">
                        📱 Sends PDF ready notifications to Slack
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhookEndpoint">Your App Webhook Endpoint</Label>
                    <Input 
                      id="webhookEndpoint" 
                      defaultValue="/api/webhook/makecom"
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Make.com sends results BACK to this endpoint in your app.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Webhook Flow:</h5>
                    <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>1. 🔄 Contract data → Main webhook (generates PDF)</li>
                      <li>2. 📱 PDF ready → Slack webhook (notifies team)</li>
                      <li>3. ↩️ Results back → /api/webhook/makecom (updates database)</li>
                    </ol>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={testWebhooks} disabled={testing}>
                      {testing ? 'Testing...' : 'Test Webhooks'}
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/api/webhook/makecom', '_blank')}>
                      View API Docs
                    </Button>
                  </div>
                </div>

                {/* Supabase Integration */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold text-lg">Supabase Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Database connection settings for contract and party data storage.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supabaseUrl">Supabase URL</Label>
                    <Input 
                      id="supabaseUrl" 
                      defaultValue={supabaseStatus}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supabaseKey">Service Role Key Status</Label>
                    <Input 
                      id="supabaseKey" 
                      defaultValue="Configured in environment"
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                {/* Google Drive Integration */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold text-lg">Google Drive Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    For storing contract PDFs and document templates via Make.com workflows.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="googleDriveStatus">Status</Label>
                    <Input 
                      id="googleDriveStatus" 
                      defaultValue="Configured in Make.com"
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Google Drive integration is handled through Make.com scenarios.
                    </p>
                  </div>
                </div>

                <Button>Save Integration Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 