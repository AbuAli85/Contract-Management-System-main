"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Plus, 
  Edit3, 
  Copy, 
  Trash2, 
  Star, 
  Clock, 
  Users, 
  Settings,
  Search,
  Filter,
  Download,
  Upload
} from "lucide-react"
// import { useTranslations } from "next-intl"

interface ContractTemplate {
  id: string
  name: string
  description: string
  category: string
  content_english: string
  content_spanish: string
  variables: string[]
  created_at: string
  updated_at: string
  usage_count: number
  is_favorite: boolean
  tags: string[]
}

interface SmartTemplateManagerProps {
  templates: ContractTemplate[]
  onCreateTemplate: (template: Omit<ContractTemplate, 'id' | 'created_at' | 'updated_at'>) => void
  onUpdateTemplate: (id: string, template: Partial<ContractTemplate>) => void
  onDeleteTemplate: (id: string) => void
  onUseTemplate: (templateId: string) => void
}

export function SmartTemplateManager({ 
  templates, 
  onCreateTemplate, 
  onUpdateTemplate, 
  onDeleteTemplate,
  onUseTemplate 
}: SmartTemplateManagerProps) {
  // const t = useTranslations("SmartTemplateManager")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "employment", label: "Employment" },
    { value: "services", label: "Services" },
    { value: "sales", label: "Sales" },
    { value: "partnership", label: "Partnership" },
    { value: "rental", label: "Rental" },
    { value: "custom", label: "Custom" }
  ]

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const TemplateCard = ({ template }: { template: ContractTemplate }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateTemplate(template.id, { is_favorite: !template.is_favorite })}
            >
              <Star className={`h-4 w-4 ${template.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{template.category}</Badge>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{template.usage_count} uses</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {template.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(template.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span>{template.variables.length} variables</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={() => onUseTemplate(template.id)}>
                <FileText className="h-4 w-4 mr-1" />
                Use Template
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCreateTemplate({ ...template, name: `${template.name} (Copy)` })}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedTemplate(template)
                  setIsEditDialogOpen(true)
                }}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDeleteTemplate(template.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TemplateForm = ({ 
    template, 
    onSubmit, 
    onCancel 
  }: { 
    template?: ContractTemplate; 
    onSubmit: (data: any) => void; 
    onCancel: () => void 
  }) => {
    const [formData, setFormData] = useState({
      name: template?.name || "",
      description: template?.description || "",
      category: template?.category || "custom",
      content_english: template?.content_english || "",
      content_spanish: template?.content_spanish || "",
      variables: template?.variables.join(", ") || "",
      tags: template?.tags.join(", ") || ""
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit({
        ...formData,
        variables: formData.variables.split(",").map(v => v.trim()).filter(v => v),
        tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
        usage_count: template?.usage_count || 0,
        is_favorite: template?.is_favorite || false
      })
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.slice(1).map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Enter tags separated by commas"
          />
        </div>

        <div>
          <Label htmlFor="variables">Variables</Label>
          <Input
            id="variables"
            value={formData.variables}
            onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
            placeholder="Enter variables separated by commas (e.g., name, date, amount)"
          />
        </div>

        <Tabs defaultValue="english" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="english">English Content</TabsTrigger>
            <TabsTrigger value="spanish">Spanish Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="english">
            <div>
              <Label htmlFor="content_english">Template Content (English)</Label>
              <Textarea
                id="content_english"
                value={formData.content_english}
                onChange={(e) => setFormData({ ...formData, content_english: e.target.value })}
                rows={10}
                required
              />
            </div>
          </TabsContent>
          
          <TabsContent value="spanish">
            <div>
              <Label htmlFor="content_spanish">Template Content (Spanish)</Label>
              <Textarea
                id="content_spanish"
                value={formData.content_spanish}
                onChange={(e) => setFormData({ ...formData, content_spanish: e.target.value })}
                rows={10}
                required
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {template ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contract Templates</h2>
          <p className="text-muted-foreground">Manage and organize your contract templates</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
              </DialogHeader>
              <TemplateForm 
                onSubmit={(data) => {
                  onCreateTemplate(data)
                  setIsCreateDialogOpen(false)
                }}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
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

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No templates found</h3>
          <p className="text-muted-foreground">Create your first template to get started</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <TemplateForm 
              template={selectedTemplate}
              onSubmit={(data) => {
                onUpdateTemplate(selectedTemplate.id, data)
                setIsEditDialogOpen(false)
                setSelectedTemplate(null)
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedTemplate(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
