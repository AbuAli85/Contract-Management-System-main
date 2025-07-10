"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Zap, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Key,
  Database,
  Mail,
  MessageSquare,
  FileText,
  DollarSign,
  Globe,
  Shield,
  Activity
} from "lucide-react"
// import { useTranslations } from "next-intl"

interface Integration {
  id: string
  name: string
  description: string
  category: "storage" | "communication" | "payment" | "automation" | "analytics" | "security"
  status: "connected" | "disconnected" | "error" | "pending"
  enabled: boolean
  config: Record<string, any>
  last_sync: string
  created_at: string
  icon: string
  webhook_url?: string
  api_key?: string
  settings: Record<string, any>
}

interface IntegrationTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  popular: boolean
  config_fields: Array<{
    name: string
    type: "text" | "password" | "url" | "select" | "boolean"
    label: string
    description: string
    required: boolean
    options?: Array<{ value: string; label: string }>
  }>
}

interface IntegrationManagerProps {
  integrations: Integration[]
  templates: IntegrationTemplate[]
  onCreateIntegration: (template: IntegrationTemplate, config: Record<string, any>) => void
  onUpdateIntegration: (id: string, updates: Partial<Integration>) => void
  onDeleteIntegration: (id: string) => void
  onTestIntegration: (id: string) => void
  onSyncIntegration: (id: string) => void
}

export function IntegrationManager({ 
  integrations, 
  templates, 
  onCreateIntegration, 
  onUpdateIntegration, 
  onDeleteIntegration,
  onTestIntegration,
  onSyncIntegration 
}: IntegrationManagerProps) {
  // const t = useTranslations("IntegrationManager")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null)
  const [configData, setConfigData] = useState<Record<string, any>>({})

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-green-100 text-green-800"
      case "disconnected": return "bg-gray-100 text-gray-800"
      case "error": return "bg-red-100 text-red-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "storage": return <Database className="h-5 w-5" />
      case "communication": return <MessageSquare className="h-5 w-5" />
      case "payment": return <DollarSign className="h-5 w-5" />
      case "automation": return <Zap className="h-5 w-5" />
      case "analytics": return <Activity className="h-5 w-5" />
      case "security": return <Shield className="h-5 w-5" />
      default: return <Globe className="h-5 w-5" />
    }
  }

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "storage", label: "Storage" },
    { value: "communication", label: "Communication" },
    { value: "payment", label: "Payment" },
    { value: "automation", label: "Automation" },
    { value: "analytics", label: "Analytics" },
    { value: "security", label: "Security" }
  ]

  const filteredIntegrations = integrations.filter(integration => 
    selectedCategory === "all" || integration.category === selectedCategory
  )

  const filteredTemplates = templates.filter(template => 
    selectedCategory === "all" || template.category === selectedCategory
  )

  const IntegrationCard = ({ integration }: { integration: Integration }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {getCategoryIcon(integration.category)}
            </div>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{integration.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={getStatusColor(integration.status)}>
              {integration.status}
            </Badge>
            <Switch
              checked={integration.enabled}
              onCheckedChange={(checked) => 
                onUpdateIntegration(integration.id, { enabled: checked })
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Sync</span>
            <span>{new Date(integration.last_sync).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTestIntegration(integration.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Test
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSyncIntegration(integration.id)}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync
              </Button>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Open edit dialog
                }}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteIntegration(integration.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TemplateCard = ({ template }: { template: IntegrationTemplate }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
      setSelectedTemplate(template)
      setIsCreateDialogOpen(true)
    }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {getCategoryIcon(template.category)}
            </div>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {template.popular && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Popular
              </Badge>
            )}
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
    </Card>
  )

  const IntegrationForm = ({ template }: { template: IntegrationTemplate }) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
        <div className="p-2 bg-white rounded-lg">
          {getCategoryIcon(template.category)}
        </div>
        <div>
          <h3 className="font-medium">{template.name}</h3>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {template.config_fields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <p className="text-xs text-muted-foreground mb-2">{field.description}</p>
            
            {field.type === "text" && (
              <Input
                id={field.name}
                value={configData[field.name] || ""}
                onChange={(e) => setConfigData({ ...configData, [field.name]: e.target.value })}
                required={field.required}
              />
            )}
            
            {field.type === "password" && (
              <Input
                id={field.name}
                type="password"
                value={configData[field.name] || ""}
                onChange={(e) => setConfigData({ ...configData, [field.name]: e.target.value })}
                required={field.required}
              />
            )}
            
            {field.type === "url" && (
              <Input
                id={field.name}
                type="url"
                value={configData[field.name] || ""}
                onChange={(e) => setConfigData({ ...configData, [field.name]: e.target.value })}
                required={field.required}
              />
            )}
            
            {field.type === "select" && field.options && (
              <Select
                value={configData[field.name] || ""}
                onValueChange={(value) => setConfigData({ ...configData, [field.name]: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {field.type === "boolean" && (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.name}
                  checked={configData[field.name] || false}
                  onCheckedChange={(checked) => 
                    setConfigData({ ...configData, [field.name]: checked })
                  }
                />
                <Label htmlFor={field.name} className="text-sm">
                  {field.label}
                </Label>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            setIsCreateDialogOpen(false)
            setSelectedTemplate(null)
            setConfigData({})
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => {
            onCreateIntegration(template, configData)
            setIsCreateDialogOpen(false)
            setSelectedTemplate(null)
            setConfigData({})
          }}
        >
          Connect
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrations</h2>
          <p className="text-muted-foreground">Manage your third-party integrations</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Integration
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrations.filter(i => i.status === "connected" && i.enabled).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {integrations.filter(i => i.status === "error").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex items-center space-x-4">
        <Label htmlFor="category-filter" className="text-sm font-medium">
          Category:
        </Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Integrations */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">My Integrations</TabsTrigger>
          <TabsTrigger value="available">Available Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredIntegrations.map(integration => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
          
          {filteredIntegrations.length === 0 && (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No integrations found</h3>
              <p className="text-muted-foreground">Connect your first integration to get started</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No templates available</h3>
              <p className="text-muted-foreground">Check back later for more integration options</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Integration Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
          </DialogHeader>
          {selectedTemplate ? (
            <IntegrationForm template={selectedTemplate} />
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">Select an integration template to get started</p>
              <div className="grid gap-3">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded">
                        {getCategoryIcon(template.category)}
                      </div>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
