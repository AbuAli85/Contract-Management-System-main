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
  CheckCircle2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { ContractTemplateSelector, ContractTemplate } from "./contract-template-selector"
import { cn } from "@/lib/utils"

// Dynamic form schema based on template
const createContractFormSchema = (template?: ContractTemplate) => {
  const baseSchema = {
    template_id: z.string().min(1, "Please select a template"),
    first_party_id: z.string().min(1, "Please select the first party"),
    second_party_id: z.string().min(1, "Please select the second party"),
    contract_start_date: z.date({
      required_error: "Contract start date is required",
      invalid_type_error: "Please enter a valid start date",
    }),
    contract_end_date: z.date({
      required_error: "Contract end date is required",
      invalid_type_error: "Please enter a valid end date",
    }),
  }

  // Add fields based on template
  const templateFields: Record<string, any> = {}

  if (template?.fields.includes("promoter_id")) {
    templateFields.promoter_id = z.string().min(1, "Please select a promoter")
  } else {
    templateFields.promoter_id = z.string().optional().nullable()
  }

  if (template?.fields.includes("contract_value")) {
    templateFields.contract_value = z.coerce
      .number({ invalid_type_error: "Contract value must be a number" })
      .min(0, "Contract value must be positive")
      .max(999999999, "Contract value is too large")
  } else {
    templateFields.contract_value = z.coerce.number().optional().nullable()
  }

  if (template?.fields.includes("job_title")) {
    templateFields.job_title = z.string().min(1, "Job title is required").max(100)
  } else {
    templateFields.job_title = z.string().max(100).optional().nullable()
  }

  if (template?.fields.includes("work_location")) {
    templateFields.work_location = z.string().min(1, "Work location is required").max(200)
  } else {
    templateFields.work_location = z.string().max(200).optional().nullable()
  }

  // Template-specific fields
  if (template?.fields.includes("deliverables")) {
    templateFields.deliverables = z.string().min(1, "Deliverables are required")
  }

  if (template?.fields.includes("payment_terms")) {
    templateFields.payment_terms = z.string().min(1, "Payment terms are required")
  }

  if (template?.fields.includes("hourly_rate")) {
    templateFields.hourly_rate = z.coerce.number().min(0, "Hourly rate must be positive")
  }

  if (template?.fields.includes("project_scope")) {
    templateFields.project_scope = z.string().min(1, "Project scope is required")
  }

  const schema = z
    .object({
      ...baseSchema,
      ...templateFields,
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

  return schema
}

type ContractFormValues = z.infer<ReturnType<typeof createContractFormSchema>>

interface ContractGeneratorFormWithTemplateProps {
  contract?: ContractDetail
  onSuccess?: () => void
  className?: string
}

export function ContractGeneratorFormWithTemplate({
  contract,
  onSuccess,
  className,
}: ContractGeneratorFormWithTemplateProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  // Data fetching
  const { data: parties, isLoading: partiesLoading, error: partiesError } = useParties()
  const { data: promoters, isLoading: promotersLoading, error: promotersError } = usePromoters()

  const isEditing = useMemo(() => Boolean(contract), [contract])
  const isLoading = useMemo(
    () => partiesLoading || promotersLoading,
    [partiesLoading, promotersLoading]
  )

  // Dynamic form schema based on selected template
  const formSchema = useMemo(
    () => createContractFormSchema(selectedTemplate || undefined),
    [selectedTemplate]
  )

  // Form setup with dynamic schema
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(formSchema),
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

      // Reset optional fields based on template
      if (!selectedTemplate.fields.includes("promoter_id")) {
        form.setValue("promoter_id", "")
      }
      if (!selectedTemplate.fields.includes("contract_value")) {
        form.setValue("contract_value", undefined)
      }
      if (!selectedTemplate.fields.includes("job_title")) {
        form.setValue("job_title", "")
      }
      if (!selectedTemplate.fields.includes("work_location")) {
        form.setValue("work_location", "")
      }
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
              template_category: selectedTemplate?.category,
            },
          }

          if (isEditing && contract) {
            await updateContract(contract.id, payload)
            toast.success("Contract updated successfully!", {
              description: "All changes have been saved.",
            })
          } else {
            await createContract(payload as ContractInsert)
            toast.success("Contract created successfully!", {
              description: "Your contract is being generated.",
            })
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
          toast.error(isEditing ? "Failed to update contract" : "Failed to create contract", {
            description: errorMessage,
          })
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
            <ContractTemplateSelector
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
                    {selectedTemplate?.description}
                  </span>
                </AlertDescription>
              </Alert>

              {/* Parties Section */}
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
                        <FormLabel className="text-sm font-medium">
                          First Party <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription>
                          {selectedTemplate?.category === "employment"
                            ? "The employer organization"
                            : "The client or service recipient"}
                        </FormDescription>
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
                        <FormLabel className="text-sm font-medium">
                          Second Party <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription>
                          {selectedTemplate?.category === "employment"
                            ? "The contracting company"
                            : "The service provider"}
                        </FormDescription>
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

              {/* Promoter Section - Only show if template requires it */}
              {selectedTemplate?.fields.includes("promoter_id") && (
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
                          <FormLabel className="text-sm font-medium">
                            Assigned Promoter <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormDescription>
                            Select the promoter who will be working under this contract
                          </FormDescription>
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

              {/* Contract Dates Section */}
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
                        <FormLabel className="text-sm font-medium">
                          Start Date <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription>When the contract becomes effective</FormDescription>
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
                        <FormLabel className="text-sm font-medium">
                          End Date <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription>When the contract expires</FormDescription>
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

              {/* Template-specific fields */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contract Details</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Contract Value - Show based on template */}
                  {selectedTemplate?.fields.includes("contract_value") && (
                    <FormField
                      control={form.control}
                      name="contract_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Contract Value <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormDescription>Total monetary value</FormDescription>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                disabled={isPending}
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

                  {/* Job Title - Show based on template */}
                  {selectedTemplate?.fields.includes("job_title") && (
                    <FormField
                      control={form.control}
                      name="job_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Job Title <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormDescription>Position or role description</FormDescription>
                          <FormControl>
                            <div className="relative">
                              <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="e.g., Software Developer"
                                disabled={isPending}
                                className="pl-10"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Hourly Rate - For freelance contracts */}
                  {selectedTemplate?.fields.includes("hourly_rate") && (
                    <FormField
                      control={form.control}
                      name="hourly_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Hourly Rate <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormDescription>Rate per hour</FormDescription>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                disabled={isPending}
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

                {/* Work Location - Show based on template */}
                {selectedTemplate?.fields.includes("work_location") && (
                  <FormField
                    control={form.control}
                    name="work_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Work Location <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription>Primary work location or address</FormDescription>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="e.g., Riyadh, Saudi Arabia"
                              disabled={isPending}
                              className="pl-10"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Project Scope - For freelance contracts */}
                {selectedTemplate?.fields.includes("project_scope") && (
                  <FormField
                    control={form.control}
                    name="project_scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Project Scope <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription>Detailed description of the project scope</FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the project scope and objectives..."
                            disabled={isPending}
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

                {/* Deliverables - For service agreements */}
                {selectedTemplate?.fields.includes("deliverables") && (
                  <FormField
                    control={form.control}
                    name="deliverables"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Deliverables <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription>List of deliverables and milestones</FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="List the key deliverables..."
                            disabled={isPending}
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

                {/* Payment Terms - For service agreements */}
                {selectedTemplate?.fields.includes("payment_terms") && (
                  <FormField
                    control={form.control}
                    name="payment_terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Payment Terms <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription>Payment schedule and terms</FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Describe payment terms and schedule..."
                            disabled={isPending}
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
                      ? "Updating Contract..."
                      : "Creating Contract..."
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

export default ContractGeneratorFormWithTemplate
