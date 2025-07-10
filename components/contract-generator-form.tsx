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
  Plus
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

// Enhanced validation schema with better error messages and cross-field validation
const contractFormSchema = z.object({
  first_party_id: z.string().min(1, "Please select the first party"),
  second_party_id: z.string().min(1, "Please select the second party"),
  promoter_id: z.string().min(1, "Please select a promoter"),
  contract_start_date: z.date({ 
    required_error: "Contract start date is required",
    invalid_type_error: "Please enter a valid start date"
  }),
  contract_end_date: z.date({ 
    required_error: "Contract end date is required",
    invalid_type_error: "Please enter a valid end date"
  }),
  contract_value: z.coerce
    .number({ invalid_type_error: "Contract value must be a number" })
    .min(0, "Contract value must be positive")
    .max(999999999, "Contract value is too large")
    .optional()
    .nullable(),
  job_title: z.string()
    .max(100, "Job title is too long")
    .optional()
    .nullable(),
  work_location: z.string()
    .max(200, "Work location is too long")
    .optional()
    .nullable(),
}).refine((data) => {
  if (data.contract_start_date && data.contract_end_date) {
    return data.contract_end_date > data.contract_start_date
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["contract_end_date"],
}).refine((data) => {
  return data.first_party_id !== data.second_party_id
}, {
  message: "First party and second party must be different",
  path: ["second_party_id"],
})

type ContractFormValues = z.infer<typeof contractFormSchema>

interface ContractGeneratorFormProps {
  contract?: ContractDetail
  onSuccess?: () => void
  className?: string
}

// Loading skeleton component
const FormSkeleton = React.memo(() => (
  <div className="space-y-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
))
FormSkeleton.displayName = "FormSkeleton"

// Enhanced input wrapper with icon
const InputWithIcon = React.memo(({ 
  icon: Icon, 
  children, 
  error 
}: { 
  icon: React.ElementType
  children: React.ReactNode
  error?: boolean 
}) => (
  <div className="relative">
    <Icon className={`absolute left-3 top-3 h-4 w-4 pointer-events-none transition-colors ${
      error ? "text-destructive" : "text-muted-foreground"
    }`} />
    <div className="pl-10">
      {children}
    </div>
  </div>
))
InputWithIcon.displayName = "InputWithIcon"

export function ContractGeneratorForm({ 
  contract, 
  onSuccess, 
  className 
}: ContractGeneratorFormProps) {
  // Hooks
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isFormValid, setIsFormValid] = useState(false)

  // Data fetching
  const { data: parties, isLoading: partiesLoading, error: partiesError } = useParties()
  const { data: promoters, isLoading: promotersLoading, error: promotersError } = usePromoters()

  // Memoized values
  const isEditing = useMemo(() => Boolean(contract), [contract])
  const isLoading = useMemo(() => partiesLoading || promotersLoading, [partiesLoading, promotersLoading])
  const hasDataError = useMemo(() => partiesError || promotersError, [partiesError, promotersError])

  // Form default values with better handling
  const defaultValues: Partial<ContractFormValues> = useMemo(() => {
    if (!contract) return {}
    
    return {
      first_party_id: contract.first_party_id || "",
      second_party_id: contract.second_party_id || "",
      promoter_id: contract.promoter_id || "",
      contract_start_date: contract.contract_start_date 
        ? new Date(contract.contract_start_date) 
        : undefined,
      contract_end_date: contract.contract_end_date 
        ? new Date(contract.contract_end_date) 
        : undefined,
      contract_value: contract.contract_value ?? null,
      job_title: contract.job_title ?? null,
      work_location: contract.work_location ?? null,
    }
  }, [contract])

  // Form setup
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues,
    mode: "onBlur",
  })

  // Watch form state for validation
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsFormValid(form.formState.isValid)
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Memoized options with better formatting
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

  // Enhanced submit handler
  const onSubmit = useCallback((data: ContractFormValues) => {
    setError(null)
    startTransition(async () => {
      try {
        const payload: Partial<ContractInsert> = {
          ...data,
          contract_start_date: data.contract_start_date.toISOString(),
          contract_end_date: data.contract_end_date.toISOString(),
          contract_value: data.contract_value || null,
          job_title: data.job_title || null,
          work_location: data.work_location || null,
        }

        if (isEditing && contract) {
          await updateContract(contract.id, payload)
          toast.success("Contract updated successfully!", {
            description: "All changes have been saved.",
          })
        } else {
          await createContract(payload as ContractInsert)
          toast.success("Contract created successfully!", {
            description: "Your new contract is ready for review.",
          })
        }

        // Call success callback or navigate
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
  }, [isEditing, contract, onSuccess, router])

  // Reset error when form changes
  useEffect(() => {
    if (error) {
      setError(null)
    }
  }, [form.watch()])

  // Loading state
  if (isLoading) {
    return (
      <Card className={`max-w-4xl mx-auto ${className || ""}`}>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <FormSkeleton />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (hasDataError) {
    return (
      <Card className={`max-w-4xl mx-auto ${className || ""}`}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load required data. Please refresh the page and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`max-w-4xl mx-auto shadow-lg ${className || ""}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
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
              {isEditing 
                ? "Update the contract details below to save your changes"
                : "Fill in the contract details to generate a new contract document"
              }
            </CardDescription>
          </div>
          {isEditing && (
            <Badge variant="secondary" className="text-sm">
              Editing Mode
            </Badge>
          )}
        </div>
        <Separator />
      </CardHeader>

      <CardContent className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Parties Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Contract Parties</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="first_party_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">First Party</FormLabel>
                      <FormDescription>
                        Typically the client or service recipient
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
                      <FormLabel className="text-sm font-medium">Second Party</FormLabel>
                      <FormDescription>
                        Typically the employer or service provider
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

            {/* Promoter Section */}
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
                    <FormLabel className="text-sm font-medium">Assigned Promoter</FormLabel>
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

            {/* Contract Dates Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Contract Duration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contract_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Start Date</FormLabel>
                      <FormDescription>
                        When the contract becomes effective
                      </FormDescription>
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
                      <FormLabel className="text-sm font-medium">End Date</FormLabel>
                      <FormDescription>
                        When the contract expires
                      </FormDescription>
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

            {/* Contract Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Contract Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contract_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Contract Value</FormLabel>
                      <FormDescription>
                        Total monetary value (optional)
                      </FormDescription>
                      <FormControl>
                        <InputWithIcon 
                          icon={DollarSign} 
                          error={!!form.formState.errors.contract_value}
                        >
                          <Input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            disabled={isPending}
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value
                              field.onChange(value === "" ? null : parseFloat(value))
                            }}
                            value={field.value ?? ""}
                          />
                        </InputWithIcon>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Job Title</FormLabel>
                      <FormDescription>
                        Position or role description (optional)
                      </FormDescription>
                      <FormControl>
                        <InputWithIcon 
                          icon={Briefcase} 
                          error={!!form.formState.errors.job_title}
                        >
                          <Input
                            placeholder="e.g., Software Developer"
                            disabled={isPending}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </InputWithIcon>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="work_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Work Location</FormLabel>
                    <FormDescription>
                      Primary work location or address (optional)
                    </FormDescription>
                    <FormControl>
                      <InputWithIcon 
                        icon={MapPin} 
                        error={!!form.formState.errors.work_location}
                      >
                        <Input
                          placeholder="e.g., Riyadh, Saudi Arabia"
                          disabled={isPending}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </InputWithIcon>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Indicator */}
            {form.formState.isSubmitSuccessful && !error && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Contract {isEditing ? "updated" : "created"} successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                size="lg"
                disabled={isPending || !isFormValid}
                className="min-w-[200px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending
                  ? isEditing
                    ? "Updating Contract..."
                    : "Creating Contract..."
                  : isEditing
                  ? "Update Contract"
                  : "Create Contract"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default ContractGeneratorForm