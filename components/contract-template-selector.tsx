"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileText,
  Briefcase,
  Users,
  Zap,
  CheckCircle2,
  Info,
  ArrowRight,
  Settings,
  FileCheck,
} from "lucide-react"
import { useSupabase } from "@/components/supabase-provider"
import { cn } from "@/lib/utils"

export interface ContractTemplate {
  id: string
  name: string
  description: string
  category: string
  fields: string[]
  make_scenario_id?: string
  document_url?: string
  metadata?: Record<string, any>
  is_active: boolean
  icon?: React.ElementType
  features?: string[]
}

interface ContractTemplateSelectorProps {
  onSelectTemplate: (template: ContractTemplate) => void
  selectedTemplateId?: string
  className?: string
}

// Template icons mapping
const templateIcons: Record<string, React.ElementType> = {
  "standard-employment": Briefcase,
  "service-agreement": FileCheck,
  "partnership-agreement": Users,
  "freelance-contract": Zap,
}

// Template features mapping
const templateFeatures: Record<string, string[]> = {
  "standard-employment": [
    "Full-time employment terms",
    "Salary and benefits",
    "Probation period",
    "Notice period",
    "Work location",
  ],
  "service-agreement": [
    "Service scope definition",
    "Deliverables tracking",
    "Payment milestones",
    "Performance metrics",
    "Termination clauses",
  ],
  "partnership-agreement": [
    "Profit sharing terms",
    "Capital contributions",
    "Decision making process",
    "Exit strategies",
    "Dispute resolution",
  ],
  "freelance-contract": [
    "Project-based work",
    "Hourly/fixed rates",
    "Revision limits",
    "IP ownership",
    "Flexible duration",
  ],
}

export function ContractTemplateSelector({
  onSelectTemplate,
  selectedTemplateId,
  className,
}: ContractTemplateSelectorProps) {
  const { supabase } = useSupabase()
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState(selectedTemplateId || "")

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (fetchError) throw fetchError

      // Enhance templates with icons and features
      const enhancedTemplates = (data || []).map((template) => ({
        ...template,
        icon: templateIcons[template.id] || FileText,
        features: templateFeatures[template.id] || [],
      }))

      setTemplates(enhancedTemplates)
    } catch (err: any) {
      setError(err.message || "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (templateId: string) => {
    setSelectedId(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      onSelectTemplate(template)
    }
  }

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (templates.length === 0) {
    return (
      <Alert className={className}>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No contract templates available. Please contact your administrator.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h3 className="mb-2 text-lg font-semibold">Select Contract Template</h3>
        <p className="text-sm text-muted-foreground">
          Choose a template that best fits your contract requirements
        </p>
      </div>

      <RadioGroup
        value={selectedId}
        onValueChange={handleSelectTemplate}
        className="grid gap-4 md:grid-cols-2"
      >
        {templates.map((template) => {
          const Icon = template.icon || FileText
          const isSelected = selectedId === template.id

          return (
            <div key={template.id} className="relative">
              <RadioGroupItem value={template.id} id={template.id} className="peer sr-only" />
              <Label
                htmlFor={template.id}
                className={cn(
                  "flex h-full cursor-pointer flex-col rounded-lg border-2 p-4 transition-all hover:bg-accent",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-accent-foreground/20"
                )}
              >
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="p-0 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded-lg p-2",
                            isSelected ? "bg-primary/10" : "bg-muted"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <CardDescription className="mb-3 text-sm">
                      {template.description}
                    </CardDescription>

                    {template.features && template.features.length > 0 && (
                      <div className="space-y-1">
                        {template.features.slice(0, 3).map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {template.make_scenario_id && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Settings className="h-3 w-3" />
                        <span>Automated document generation</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Label>
            </div>
          )
        })}
      </RadioGroup>

      {selectedId && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Selected:</strong> {templates.find((t) => t.id === selectedId)?.name}
            <br />
            This template will determine which fields are required and how the contract document is
            generated.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
