"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, CheckCircle2, Info } from "lucide-react"
import { useSupabase } from "@/components/supabase-provider"
import { cn } from "@/lib/utils"

// Simplified template interface that matches current database structure
export interface SimpleContractTemplate {
  id: string
  name: string
  doc_template_id: string
  created_at?: string
  is_active?: boolean
}

interface ContractTemplateSelectorSimpleProps {
  onSelectTemplate: (template: SimpleContractTemplate) => void
  selectedTemplateId?: string
  className?: string
}

// Default template configurations (since they're not in the database yet)
const templateConfigs: Record<
  string,
  {
    description: string
    category: string
    fields: string[]
    icon: string
  }
> = {
  "Standard Employment Contract": {
    description: "Full-time employment agreement with standard terms",
    category: "employment",
    fields: [
      "first_party_id",
      "second_party_id",
      "promoter_id",
      "contract_start_date",
      "contract_end_date",
      "contract_value",
      "job_title",
      "work_location",
    ],
    icon: "💼",
  },
  "Service Agreement": {
    description: "Professional services contract for consultants",
    category: "service",
    fields: [
      "first_party_id",
      "second_party_id",
      "promoter_id",
      "contract_start_date",
      "contract_end_date",
      "contract_value",
      "deliverables",
      "payment_terms",
    ],
    icon: "📋",
  },
  "Partnership Agreement": {
    description: "Business partnership with profit sharing",
    category: "partnership",
    fields: ["first_party_id", "second_party_id", "contract_start_date", "contract_end_date"],
    icon: "���",
  },
  "Freelance Contract": {
    description: "Project-based work agreement",
    category: "freelance",
    fields: [
      "first_party_id",
      "second_party_id",
      "promoter_id",
      "contract_start_date",
      "contract_end_date",
      "hourly_rate",
      "project_scope",
    ],
    icon: "⚡",
  },
}

export function ContractTemplateSelectorSimple({
  onSelectTemplate,
  selectedTemplateId,
  className,
}: ContractTemplateSelectorSimpleProps) {
  const { supabase } = useSupabase()
  const [templates, setTemplates] = useState<SimpleContractTemplate[]>([])
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
        .order("name")

      if (fetchError) throw fetchError

      setTemplates(data || [])
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

  const getTemplateConfig = (templateName: string) => {
    return (
      templateConfigs[templateName] || {
        description: "Contract template",
        category: "general",
        fields: ["first_party_id", "second_party_id", "contract_start_date", "contract_end_date"],
        icon: "📄",
      }
    )
  }

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
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
          No contract templates available. Please add templates to the database first.
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
          const config = getTemplateConfig(template.name)
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
                        <div className="text-2xl">{config.icon}</div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {config.category}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <CardDescription className="text-sm">{config.description}</CardDescription>
                    {template.doc_template_id && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Template ID: {template.doc_template_id}
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
            <span className="text-xs text-muted-foreground">
              This template will be used to generate your contract document.
            </span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
