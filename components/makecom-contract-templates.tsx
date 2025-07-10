// components/makecom-contract-templates.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Settings, 
  FileText, 
  Download, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Copy,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MakecomContractType {
  id: string
  name: string
  description: string
  category: string
  makecomTemplateId: string
  requiredFields: string[]
  businessRules: string[]
  omanCompliant: boolean
}

interface TemplateConfig {
  id: string
  name: string
  googleDocsTemplateId: string
  templatePlaceholders: Record<string, string>
  makecomModuleConfig: {
    webhookTriggerFields: string[]
    templateVariables: Record<string, string>
    outputFormat: string
    googleDriveSettings?: {
      folderId?: string
      naming: string
    }
  }
}

export default function MakecomContractTemplates() {
  const [contractTypes, setContractTypes] = useState<MakecomContractType[]>([])
  const [selectedType, setSelectedType] = useState<string>("")
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null)
  const [blueprint, setBlueprint] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  // Load Make.com enabled contract types
  useEffect(() => {
    const loadContractTypes = async () => {
      try {
        const response = await fetch('/api/contracts/makecom/generate?action=types')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && Array.isArray(result.data)) {
          setContractTypes(result.data)
          if (result.data.length > 0) {
            setSelectedType(result.data[0].id)
          }
        } else {
          console.error('Invalid response format:', result)
          setContractTypes([])
          toast({
            title: "Error",
            description: "Invalid response format from server",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Failed to load contract types:', error)
        setContractTypes([])
        toast({
          title: "Error",
          description: "Failed to load Make.com contract types",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadContractTypes()
  }, [toast])

  // Load template configuration when type changes
  useEffect(() => {
    if (selectedType) {
      loadTemplateConfig(selectedType)
    }
  }, [selectedType])

  const loadTemplateConfig = async (contractType: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/contracts/makecom/generate?action=template&type=${contractType}`)
      const result = await response.json()
      
      if (result.success) {
        setTemplateConfig(result.data.templateConfig)
      } else {
        toast({
          title: "Error",
          description: "Failed to load template configuration",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to load template config:', error)
      toast({
        title: "Error",
        description: "Failed to load template configuration",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateBlueprint = async () => {
    if (!selectedType) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/contracts/makecom/generate?action=blueprint&type=${selectedType}`)
      const result = await response.json()
      
      if (result.success) {
        setBlueprint(result.data)
        setActiveTab("blueprint")
        toast({
          title: "Success",
          description: "Make.com blueprint generated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to generate blueprint",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to generate blueprint:', error)
      toast({
        title: "Error",
        description: "Failed to generate blueprint",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Content copied to clipboard"
    })
  }

  const downloadBlueprint = () => {
    if (!blueprint) return
    
    const dataStr = JSON.stringify(blueprint, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `makecom_blueprint_${selectedType}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const selectedContractType = contractTypes.find(type => type.id === selectedType)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-6xl space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="font-heading text-3xl font-bold md:text-4xl">
            Make.com Contract Templates
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage and configure automated contract generation with Make.com integration
          </p>
        </motion.div>

        {/* Contract Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="w-full max-w-md">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contract type" />
              </SelectTrigger>
              <SelectContent>
                {contractTypes && contractTypes.length > 0 ? (
                  contractTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    {loading ? "Loading contract types..." : "No contract types available"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      {!contractTypes || contractTypes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span>Loading Make.com contract templates...</span>
                  </div>
                ) : (
                  <div>
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                    <h3 className="text-lg font-semibold mb-2">No Contract Templates Found</h3>
                    <p>Make.com contract templates are not available. Please check your configuration.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : selectedContractType ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="blueprint">Blueprint</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedContractType.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedContractType.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{selectedContractType.category}</Badge>
                    {selectedContractType.omanCompliant && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Oman Compliant
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-blue-600">
                      <Zap className="h-3 w-3 mr-1" />
                      Make.com Enabled
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Required Fields</h4>
                      <div className="space-y-1">
                        {selectedContractType && selectedContractType.requiredFields ? (
                          selectedContractType.requiredFields.map((field, idx) => (
                            <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No required fields defined</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Business Rules</h4>
                      <div className="space-y-1">
                        {selectedContractType && selectedContractType.businessRules ? (
                          selectedContractType.businessRules.slice(0, 4).map((rule, idx) => (
                            <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span>{rule}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No business rules defined</div>
                        )}
                        {selectedContractType && selectedContractType.businessRules && selectedContractType.businessRules.length > 4 && (
                          <div className="text-sm text-blue-600">
                            +{selectedContractType.businessRules.length - 4} more rules
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Template Tab */}
            <TabsContent value="template" className="space-y-6">
              {templateConfig ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Template Configuration
                      </CardTitle>
                      <CardDescription>
                        Google Docs template and placeholder configuration
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Google Docs Template ID</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                            {templateConfig.googleDocsTemplateId}
                          </code>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(templateConfig.googleDocsTemplateId)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Template Placeholders</label>
                        <div className="space-y-2 mt-2">
                          {templateConfig && templateConfig.templatePlaceholders ? (
                            Object.entries(templateConfig.templatePlaceholders).map(([key, description]) => (
                              <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                                <code className="text-sm text-blue-600">{key}</code>
                                <span className="text-xs text-muted-foreground">{description}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">No template placeholders defined</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Make.com Module Config
                      </CardTitle>
                      <CardDescription>
                        Webhook triggers and template variables
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Webhook Trigger Fields</label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {templateConfig && templateConfig.makecomModuleConfig && templateConfig.makecomModuleConfig.webhookTriggerFields ? (
                            templateConfig.makecomModuleConfig.webhookTriggerFields.map((field) => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">No webhook trigger fields defined</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Output Format</label>
                        <Badge className="ml-2">{templateConfig.makecomModuleConfig.outputFormat.toUpperCase()}</Badge>
                      </div>

                      {templateConfig.makecomModuleConfig.googleDriveSettings && (
                        <div>
                          <label className="text-sm font-medium">Google Drive Settings</label>
                          <div className="mt-2 space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Folder ID:</span>{' '}
                              <code className="bg-muted px-1 rounded">
                                {templateConfig.makecomModuleConfig.googleDriveSettings.folderId}
                              </code>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Naming Pattern:</span>{' '}
                              <code className="bg-muted px-1 rounded">
                                {templateConfig.makecomModuleConfig.googleDriveSettings.naming}
                              </code>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      {loading ? "Loading template configuration..." : "Select a contract type to view template configuration"}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Blueprint Tab */}
            <TabsContent value="blueprint" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Make.com Blueprint
                    </CardTitle>
                    <CardDescription>
                      Generated Make.com scenario blueprint for automated contract processing
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={generateBlueprint} disabled={loading}>
                      <Play className="h-4 w-4 mr-2" />
                      Generate Blueprint
                    </Button>
                    {blueprint && (
                      <Button variant="outline" onClick={downloadBlueprint}>
                        <Download className="h-4 w-4 mr-2" />
                        Download JSON
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {blueprint ? (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Blueprint generated successfully! Import this JSON file into Make.com to create the automated workflow.
                        </AlertDescription>
                      </Alert>
                      
                      <div>
                        <label className="text-sm font-medium">Blueprint JSON</label>
                        <pre className="mt-2 bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                          {JSON.stringify(blueprint, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      {loading ? "Generating blueprint..." : "Click 'Generate Blueprint' to create Make.com workflow configuration"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Test Contract Generation
                  </CardTitle>
                  <CardDescription>
                    Test the Make.com integration with sample data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Testing functionality will be available once you have configured your Make.com webhook URLs in the environment variables.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-4">
                    <Button variant="outline" disabled>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test Webhook (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      ) : null}
    </motion.div>
  )
}
