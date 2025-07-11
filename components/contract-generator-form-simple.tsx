"use client"

import React, { useState, useTransition, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import {
  CalendarDays,
  Users,
  UserCheck,
  DollarSign,
  Briefcase,
  MapPin,
  Loader2,
  AlertCircle,
  Save,
  Plus,
  FileText,
  ArrowLeft,
  ArrowRight,
  Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { ContractDetail, Party, Promoter } from "@/lib/types"
import { useParties } from "@/hooks/use-parties"
import { usePromoters } from "@/hooks/use-promoters"
import { ComboboxField } from "./combobox-field"
import { DatePickerWithManualInput } from "./date-picker-with-manual-input"
import { createContract, updateContract, ContractInsert } from "@/app/actions/contracts"
import {
  ContractTemplateSelectorSimple,
  SimpleContractTemplate,
} from "./contract-template-selector-simple"
import { cn } from "@/lib/utils"

// Template configurations
const templateConfigs: Record<
  string,
  {
    fields: string[]
    category: string
  }
> = {
  "Standard Employment Contract": {
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
  },
  "Service Agreement": {
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
  },
  "Partnership Agreement": {
    category: "partnership",
    fields: ["first_party_id", "second_party_id", "contract_start_date", "contract_end_date"],
  },
  "Freelance Contract": {
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
  },
}

// Base schema
const baseSchema = z
  .object({
    template_id: z.string().min(1, "Please select a template"),
    first_party_id: z.string().min(1, "Please select the first party"),
    second_party_id: z.string().min(1, "Please select the second party"),
    promoter_id: z.string().optional().nullable(),
    contract_start_date: z.date({
      required_error: "Contract start date is required",
      invalid_type_error: "Please enter a valid start date",
    }),
    contract_end_date: z.date({
      required_error: "Contract end date is required",
      invalid_type_error: "Please enter a valid end date",
    }),
    contract_value: z.coerce.number().optional().nullable(),
    job_title: z.string().optional().nullable(),
    work_location: z.string().optional().nullable(),
    deliverables: z.string().optional().nullable(),
    payment_terms: z.string().optional().nullable(),
    hourly_rate: z.coerce.number().optional().nullable(),
    project_scope: z.string().optional().nullable(),
    metadata: z.record(z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.contract_start_date && data.contract_end_date) {
        return data.contract_end_date > data.contract_start_date
      }
      return true
    },
    {
      message: "End date must be after start date",
      path: ["contract_end_date"],
    }
  )
  .refine(
    (data) => {
      return data.first_party_id !== data.second_party_id
    },
    {
      message: "First party and second party must be different",
      path: ["second_party_id"],
    }
  )

type ContractFormValues = z.infer<typeof baseSchema>

interface ContractGeneratorFormSimpleProps {
  contract?: ContractDetail
  onSuccess?: () => void
  className?: string
}

export function ContractGeneratorFormSimple({
  contract,
  onSuccess,
  className,
}: ContractGeneratorFormSimpleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<SimpleContractTemplate | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  // Data fetching
  const { data: parties, isLoading: partiesLoading } = useParties()
  const { data: promoters, isLoading: promotersLoading } = usePromoters()

  const isEditing = useMemo(() => Boolean(contract), [contract])
  const isLoading = useMemo(
    () => partiesLoading || promotersLoading,
    [partiesLoading, promotersLoading]
  )

  // Get template config
  const templateConfig = useMemo(() => {
    if (!selectedTemplate) return null
    return (
      templateConfigs[selectedTemplate.name] || {
        fields: ["first_party_id", "second_party_id", "contract_start_date", "contract_end_date"],
        category: "general",
      }
    )
  }, [selectedTemplate])

  // Form setup
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      template_id: contract?.template_id || "",
      first_party_id: contract?.first_party_id || "",
      second_party_id: contract?.second_party_id || "",
      promoter_id: contract?.promoter_id || "",
      contract_start_date: contract?.contract_start_date
        ? new Date(contract.contract_start_date)
        : undefined,
      contract_end_date: contract?.contract_end_date
        ? new Date(contract.contract_end_date)
        : undefined,
      contract_value: contract?.contract_value ?? undefined,
      job_title: contract?.job_title ?? "",
      work_location: contract?.work_location ?? "",
      metadata: contract?.metadata || {},
    },
    mode: "onBlur",
  })

  // Update form when template changes
  useEffect(() => {
    if (selectedTemplate) {
      form.setValue("template_id", selectedTemplate.id)
    }
  }, [selectedTemplate, form])

  const partyOptions = useMemo(() => {
    if (!parties) return []
    return parties.map((party) => ({
      value: party.id,
      label: `${party.name_en}${party.crn ? ` (${party.crn})` : ""}`,
    }))
  }, [parties])

  const promoterOptions = useMemo(() => {
    if (!promoters) return []
    return promoters.map((promoter) => ({
      value: promoter.id,
      label: `${promoter.name_en}${promoter.name_ar ? ` (${promoter.name_ar})` : ""}`,
    }))
  }, [promoters])

  const onSubmit = useCallback(
    (data: ContractFormValues) => {
      setError(null)
      startTransition(async () => {
        try {
          const payload: Partial<ContractInsert> = {
            ...data,
            template_id: selectedTemplate?.id,
            contract_start_date: data.contract_start_date.toISOString(),
            contract_end_date: data.contract_end_date.toISOString(),
            contract_value: data.contract_value || null,
            job_title: data.job_title || null,
            work_location: data.work_location || null,
            metadata: {
              ...data.metadata,
              template_name: selectedTemplate?.name,
              doc_template_id: selectedTemplate?.doc_template_id,
            },
          }

          if (isEditing && contract) {
            await updateContract(contract.id, payload)
            toast.success("Contract updated successfully!")
          } else {
            await createContract(payload as ContractInsert)
            toast.success("Contract created successfully!")
          }

          if (onSuccess) {
            onSuccess()
          } else {
            router.push("/contracts")
            router.refresh()
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred"
          setError(errorMessage)
          toast.error("Failed to save contract", { description: errorMessage })
        }
      })
    },
    [isEditing, contract, onSuccess, router, selectedTemplate]
  )

  const nextStep = () => {
    if (currentStep === 1 && selectedTemplate) {
      setCurrentStep(2)
    }
  }

  const prevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  if (isLoading) {
    return (
      <Card className={cn("mx-auto max-w-4xl", className)}>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("mx-auto max-w-4xl shadow-lg", className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-3xl font-bold">
              {isEditing ? (
                <>
                  <Save className="h-8 w-8 text-primary" />
                  Edit Contract
                </>
              ) : (
                <>
                  <Plus className="h-8 w-8 text-primary" />
                  Generate New Contract
                </>
              )}
            </CardTitle>
            <CardDescription className="text-base">
              {currentStep === 1
                ? "Step 1: Select a contract template"
                : "Step 2: Fill in the contract details"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Step {currentStep} of 2</Badge>
            {selectedTemplate && (
              <Badge variant="secondary">
                <FileText className="mr-1 h-3 w-3" />
                {selectedTemplate.name}
              </Badge>
            )}
          </div>
        </div>
        <Separator />
      </CardHeader>

      <CardContent className="space-y-8">
        {currentStep === 1 ? (
          <div className="space-y-6">
            <ContractTemplateSelectorSimple
              onSelectTemplate={setSelectedTemplate}
              selectedTemplateId={selectedTemplate?.id}
            />

            <div className="flex justify-end">
              <Button onClick={nextStep} disabled={!selectedTemplate} size="lg">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Template Info */}
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>Template:</strong> {selectedTemplate?.name}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Document Template ID: {selectedTemplate?.doc_template_id}
                  </span>
                </AlertDescription>
              </Alert>

              {/* Always show parties and dates */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contract Parties</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_party_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Party *</FormLabel>
                        <FormControl>
                          <ComboboxField
                            field={field}
                            options={partyOptions}
                            placeholder="Select first party"
                            searchPlaceholder="Search parties..."
                            emptyStateMessage="No parties found"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="second_party_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Second Party *</FormLabel>
                        <FormControl>
                          <ComboboxField
                            field={field}
                            options={partyOptions}
                            placeholder="Select second party"
                            searchPlaceholder="Search parties..."
                            emptyStateMessage="No parties found"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Promoter - Show for employment/service/freelance */}
              {templateConfig?.fields.includes("promoter_id") && (
                <>
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Promoter Assignment</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="promoter_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Promoter</FormLabel>
                          <FormControl>
                            <ComboboxField
                              field={field}
                              options={promoterOptions}
                              placeholder="Select a promoter"
                              searchPlaceholder="Search promoters..."
                              emptyStateMessage="No promoters found"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Separator />
                </>
              )}

              {/* Contract Dates */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contract Duration</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contract_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <DatePickerWithManualInput
                            date={field.value}
                            setDate={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contract_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <DatePickerWithManualInput
                            date={field.value}
                            setDate={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Additional Fields Based on Template */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contract Details</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Contract Value */}
                  {templateConfig?.fields.includes("contract_value") && (
                    <FormField
                      control={form.control}
                      name="contract_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Value</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-10"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  field.onChange(value === "" ? null : parseFloat(value))
                                }}
                                value={field.value ?? ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Job Title */}
                  {templateConfig?.fields.includes("job_title") && (
                    <FormField
                      control={form.control}
                      name="job_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Software Developer"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Hourly Rate */}
                  {templateConfig?.fields.includes("hourly_rate") && (
                    <FormField
                      control={form.control}
                      name="hourly_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hourly Rate</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-10"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  field.onChange(value === "" ? null : parseFloat(value))
                                }}
                                value={field.value ?? ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Work Location */}
                {templateConfig?.fields.includes("work_location") && (
                  <FormField
                    control={form.control}
                    name="work_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Riyadh, Saudi Arabia"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Project Scope */}
                {templateConfig?.fields.includes("project_scope") && (
                  <FormField
                    control={form.control}
                    name="project_scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Scope</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the project scope..."
                            rows={4}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Deliverables */}
                {templateConfig?.fields.includes("deliverables") && (
                  <FormField
                    control={form.control}
                    name="deliverables"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deliverables</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List the key deliverables..."
                            rows={4}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Payment Terms */}
                {templateConfig?.fields.includes("payment_terms") && (
                  <FormField
                    control={form.control}
                    name="payment_terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe payment terms..."
                            rows={3}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={prevStep} disabled={isPending}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Templates
                </Button>

                <Button type="submit" size="lg" disabled={isPending} className="min-w-[200px]">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPending
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update Contract"
                      : "Create Contract"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}

export default ContractGeneratorFormSimple
