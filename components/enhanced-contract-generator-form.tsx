// components/enhanced-contract-generator-form.tsx
"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format, parseISO, differenceInDays, addMonths } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Calculator,
  Calendar,
  Users,
  Briefcase,
  MapPin,
  DollarSign
} from "lucide-react"
import { DatePickerWithManualInput } from "./date-picker-with-manual-input"
import { ComboboxField } from "@/components/combobox-field"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/supabase"
import {
  contractGeneratorSchema,
  type ContractGeneratorFormData,
  CONTRACT_FORM_SECTIONS,
  getRequiredFields
} from "@/lib/schema-generator"
import { useParties, type Party as PartyType } from "@/hooks/use-parties"
import { usePromoters } from "@/hooks/use-promoters"
import type { Promoter } from "@/types/custom"
import { 
  JOB_TITLES, 
  DEPARTMENTS, 
  CONTRACT_TYPES, 
  CURRENCIES, 
  WORK_LOCATIONS,
  getOptionLabel 
} from "@/constants/contract-options"

interface EnhancedContractGeneratorFormProps {
  /** Existing contract when editing; new contract if undefined. */
  contract?: Database["public"]["Tables"]["contracts"]["Row"] | null
  /** Callback when the form is successfully saved. */
  onFormSubmit?: () => void
  /** Show advanced fields by default */
  showAdvanced?: boolean
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

const fieldVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
}

export default function EnhancedContractGeneratorForm({
  contract,
  onFormSubmit,
  showAdvanced = false,
}: EnhancedContractGeneratorFormProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // State management
  const [currentSection, setCurrentSection] = useState(0)
  const [showAdvancedFields, setShowAdvancedFields] = useState(showAdvanced)
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null)
  const [selectedClient, setSelectedClient] = useState<PartyType | null>(null)
  const [selectedEmployer, setSelectedEmployer] = useState<PartyType | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Load parties & promoters
  const {
    data: clientParties,
    isLoading: isLoadingClientParties,
    error: clientPartiesError,
  } = useParties("Client")
  
  const {
    data: employerParties,
    isLoading: isLoadingEmployerParties,
    error: employerPartiesError,
  } = useParties("Employer")
  
  const {
    data: promoters,
    isLoading: isLoadingPromoters,
    error: promotersError,
  } = usePromoters()

  // Form setup with enhanced defaults
  const form = useForm<ContractGeneratorFormData>({
    resolver: zodResolver(contractGeneratorSchema),
    mode: "onTouched",
    defaultValues: {
      first_party_id: undefined,
      second_party_id: undefined,
      promoter_id: undefined,
      contract_start_date: undefined,
      contract_end_date: undefined,
      email: "",
      job_title: "",
      work_location: "",
      department: "",
      contract_type: "",
      currency: "OMR", // Default to OMR for Oman market
      basic_salary: undefined,
      allowances: undefined,
      probation_period_months: 3, // Default 3 months probation
      notice_period_days: 30, // Default 30 days notice
      working_hours_per_week: 40, // Standard 40 hours
      special_terms: "",
    },
  })

  // Build combobox options
  const promoterOptions = useMemo(() => {
    if (!promoters) return []
    return promoters.map((p) => ({
      value: p.id,
      label: `${p.name_en} / ${p.name_ar} (ID: ${p.id_card_number ?? "N/A"})`,
    }))
  }, [promoters])

  // Watch form values for calculations and validation
  const watchedValues = useWatch({ control: form.control })
  const watchedPromoterId = useWatch({ control: form.control, name: "promoter_id" })
  const watchedStartDate = useWatch({ control: form.control, name: "contract_start_date" })
  const watchedEndDate = useWatch({ control: form.control, name: "contract_end_date" })
  const watchedSalary = useWatch({ control: form.control, name: "basic_salary" })
  const watchedAllowances = useWatch({ control: form.control, name: "allowances" })

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    const requiredFields = getRequiredFields()
    const completedFields = requiredFields.filter(field => {
      const value = form.getValues(field as keyof ContractGeneratorFormData)
      return value !== undefined && value !== null && value !== ""
    }).length
    return Math.round((completedFields / requiredFields.length) * 100)
  }, [form, watchedValues])

  // Calculate contract duration and insights
  const contractInsights = useMemo(() => {
    if (!watchedStartDate || !watchedEndDate) return null
    
    const duration = differenceInDays(watchedEndDate, watchedStartDate)
    const totalCompensation = (watchedSalary || 0) + (watchedAllowances || 0)
    
    return {
      duration,
      durationText: duration === 1 ? "1 day" : `${duration} days`,
      isShortTerm: duration <= 90,
      isLongTerm: duration >= 365,
      totalCompensation,
      monthlyRate: totalCompensation > 0 ? totalCompensation : null
    }
  }, [watchedStartDate, watchedEndDate, watchedSalary, watchedAllowances])

  // Auto-fill promoter data when selected
  useEffect(() => {
    if (watchedPromoterId && promoters) {
      const promoter = promoters.find((p) => p.id === watchedPromoterId)
      setSelectedPromoter(promoter || null)
      
      if (promoter) {
        form.setValue('promoter_name_en', promoter.name_en)
        form.setValue('promoter_name_ar', promoter.name_ar)
        form.setValue('id_card_number', promoter.id_card_number)
        form.setValue('promoter_id_card_url', promoter.id_card_url || '')
        form.setValue('promoter_passport_url', promoter.passport_url || '')
      }
    }
  }, [watchedPromoterId, promoters, form])

  // Auto-fill party data when selected
  useEffect(() => {
    const clientId = form.watch('first_party_id')
    if (clientId && clientParties) {
      const party = clientParties.find(p => p.id === clientId)
      setSelectedClient(party || null)
      if (party) {
        form.setValue('first_party_name_en', party.name_en)
        form.setValue('first_party_name_ar', party.name_ar)
        form.setValue('first_party_crn', party.crn)
      }
    }
  }, [form.watch('first_party_id'), clientParties, form])

  useEffect(() => {
    const employerId = form.watch('second_party_id')
    if (employerId && employerParties) {
      const party = employerParties.find(p => p.id === employerId)
      setSelectedEmployer(party || null)
      if (party) {
        form.setValue('second_party_name_en', party.name_en)
        form.setValue('second_party_name_ar', party.name_ar)
        form.setValue('second_party_crn', party.crn)
      }
    }
  }, [form.watch('second_party_id'), employerParties, form])

  // Prefill when editing
  useEffect(() => {
    if (contract) {
      form.reset({
        first_party_id: contract.first_party_id ?? undefined,
        second_party_id: contract.second_party_id ?? undefined,
        promoter_id: contract.promoter_id ?? undefined,
        contract_start_date: contract.contract_start_date
          ? parseISO(contract.contract_start_date)
          : undefined,
        contract_end_date: contract.contract_end_date
          ? parseISO(contract.contract_end_date)
          : undefined,
        email: contract.email ?? "",
        job_title: contract.job_title ?? "",
        work_location: contract.work_location ?? "",
        department: contract.department ?? "",
        contract_type: contract.contract_type ?? "",
        currency: contract.currency ?? "OMR",
      })
    }
  }, [contract, form])

  // Handle errors from data loading
  useEffect(() => {
    const errors = []
    if (employerPartiesError) errors.push(`Employer parties: ${employerPartiesError.message}`)
    if (clientPartiesError) errors.push(`Client parties: ${clientPartiesError.message}`)
    if (promotersError) errors.push(`Promoters: ${promotersError.message}`)
    
    setValidationErrors(errors)
    
    if (errors.length > 0) {
      toast({
        title: "Data Loading Issues",
        description: `${errors.length} error(s) occurred while loading form data.`,
        variant: "destructive",
      })
    }
  }, [employerPartiesError, clientPartiesError, promotersError, toast])

  // Auto-suggest end date when start date changes
  useEffect(() => {
    if (watchedStartDate && !watchedEndDate) {
      // Default to 1 year contract
      const suggestedEndDate = addMonths(watchedStartDate, 12)
      form.setValue('contract_end_date', suggestedEndDate)
    }
  }, [watchedStartDate, watchedEndDate, form])

  // Contract mutation with enhanced error handling
  const { mutate: saveContract, status } = useMutation({
    mutationFn: async (values: ContractGeneratorFormData) => {
      const payload = {
        ...values,
        // Ensure dates are properly formatted
        contract_start_date: values.contract_start_date,
        contract_end_date: values.contract_end_date,
      }

      const endpoint = contract?.id ? `/api/contracts/${contract.id}` : "/api/contracts"
      const method = contract?.id ? "PUT" : "POST"

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || err.message || res.statusText)
      }

      const { contract: savedContract } = await res.json()
      return savedContract
    },
    onSuccess: async (data) => {
      const isUpdate = !!contract?.id
      
      toast({
        title: isUpdate ? "Contract Updated!" : "Contract Created!",
        description: contractInsights 
          ? `Duration: ${contractInsights.durationText}${data.pdf_url ? ` • PDF: ${data.pdf_url}` : " • PDF generation pending"}`
          : "Contract saved successfully",
      })

      if (!isUpdate) {
        form.reset()
        setCurrentSection(0)
      }
      
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      onFormSubmit?.()

      // Trigger webhook processing
      try {
        const { WebhookService } = await import('@/lib/webhook-service')
        await WebhookService.processContract({
          contract_id: data.id,
          contract_number: data.contract_number,
          client_name: data.client_name || 'N/A',
          employer_name: data.employer_name || 'N/A',
          status: 'processing'
        })
      } catch (err) {
        console.error('❌ Webhook processing error:', err)
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Saving Contract",
        description: error.message ?? "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    },
  })
  const isSubmitting = status === 'pending'

  const onSubmit = useCallback((values: ContractGeneratorFormData) => {
    saveContract(values)
  }, [saveContract])

  // Navigation helpers
  const goToNextSection = () => {
    if (currentSection < CONTRACT_FORM_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1)
    }
  }

  const goToPreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  // Validation styling helper
  const getInputStateClasses = (fieldName: keyof ContractGeneratorFormData) => {
    const fieldState = form.getFieldState(fieldName)
    if (fieldState.error) return "ring-destructive ring-2"
    if (fieldState.isDirty && !fieldState.error && fieldState.isTouched)
      return "ring-success ring-2"
    return ""
  }

  const isLoadingInitialData = isLoadingEmployerParties || isLoadingClientParties || isLoadingPromoters

  // Loading state
  if (isLoadingInitialData && !form.formState.isDirty && !employerParties && !clientParties && !promoters) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div>
            <p className="text-lg font-medium">Loading Contract Form</p>
            <p className="text-sm text-muted-foreground">
              Fetching parties and promoters data...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {contract?.id ? "Edit Contract" : "Generate New Contract"}
              </CardTitle>
              <CardDescription>
                {contract?.id 
                  ? "Update contract details and regenerate documents"
                  : "Complete all required sections to generate your contract"
                }
              </CardDescription>
            </div>
            <Badge variant={formProgress === 100 ? "default" : "secondary"} className="ml-4">
              {formProgress}% Complete
            </Badge>
          </div>
          <Progress value={formProgress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Error Alerts */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Contract Insights */}
      {contractInsights && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center gap-4 text-sm">
              <span>Duration: <strong>{contractInsights.durationText}</strong></span>
              {contractInsights.isShortTerm && (
                <Badge variant="outline">Short-term</Badge>
              )}
              {contractInsights.isLongTerm && (
                <Badge variant="outline">Long-term</Badge>
              )}
              {contractInsights.totalCompensation > 0 && (
                <span>Monthly: <strong>{form.watch('currency')} {contractInsights.totalCompensation.toLocaleString()}</strong></span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section Navigation */}
          <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
            {CONTRACT_FORM_SECTIONS.map((section, index) => (
              <Button
                key={section.id}
                type="button"
                variant={currentSection === index ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentSection(index)}
                className="flex items-center gap-2"
              >
                {index === 0 && <Users className="h-4 w-4" />}
                {index === 1 && <Briefcase className="h-4 w-4" />}
                {index === 2 && <Calendar className="h-4 w-4" />}
                {index === 3 && <MapPin className="h-4 w-4" />}
                {index === 4 && <DollarSign className="h-4 w-4" />}
                {index === 5 && <Calculator className="h-4 w-4" />}
                <span className="hidden sm:inline">{section.title}</span>
                {section.required && <span className="text-destructive">*</span>}
              </Button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {/* Render current section */}
              {currentSection === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Contracting Parties
                    </CardTitle>
                    <CardDescription>
                      Select the client organization and employer organization for this contract
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <motion.div variants={fieldVariants}>
                        <FormField
                          control={form.control}
                          name="first_party_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Party A (Client) *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value ?? ""}
                                disabled={isSubmitting || isLoadingClientParties}
                              >
                                <FormControl>
                                  <SelectTrigger className={getInputStateClasses("first_party_id")}>
                                    <SelectValue
                                      placeholder={
                                        isLoadingClientParties
                                          ? "Loading Clients..."
                                          : "Select Client Organization"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isLoadingClientParties ? (
                                    <SelectItem value="loading" disabled>
                                      <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading...
                                      </div>
                                    </SelectItem>
                                  ) : !clientParties?.length ? (
                                    <SelectItem value="no-data" disabled>
                                      No client organizations found
                                    </SelectItem>
                                  ) : (
                                    clientParties.map((party) => (
                                      <SelectItem key={party.id} value={party.id}>
                                        <div className="flex flex-col">
                                          <span>{party.name_en}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {party.name_ar} {party.crn && `• CRN: ${party.crn}`}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The client organization requesting the employment services
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      <motion.div variants={fieldVariants}>
                        <FormField
                          control={form.control}
                          name="second_party_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Party B (Employer) *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value ?? ""}
                                disabled={isSubmitting || isLoadingEmployerParties}
                              >
                                <FormControl>
                                  <SelectTrigger className={getInputStateClasses("second_party_id")}>
                                    <SelectValue
                                      placeholder={
                                        isLoadingEmployerParties
                                          ? "Loading Employers..."
                                          : "Select Employer Organization"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isLoadingEmployerParties ? (
                                    <SelectItem value="loading" disabled>
                                      <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading...
                                      </div>
                                    </SelectItem>
                                  ) : !employerParties?.length ? (
                                    <SelectItem value="no-data" disabled>
                                      No employer organizations found
                                    </SelectItem>
                                  ) : (
                                    employerParties.map((party) => (
                                      <SelectItem key={party.id} value={party.id}>
                                        <div className="flex flex-col">
                                          <span>{party.name_en}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {party.name_ar} {party.crn && `• CRN: ${party.crn}`}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The employer organization that will employ the promoter
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    </div>

                    {/* Selected Parties Summary */}
                    {(selectedClient || selectedEmployer) && (
                      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium">Selected Organizations:</h4>
                        {selectedClient && (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">Client</Badge>
                            <span>{selectedClient.name_en} / {selectedClient.name_ar}</span>
                            {selectedClient.crn && (
                              <span className="text-muted-foreground">CRN: {selectedClient.crn}</span>
                            )}
                          </div>
                        )}
                        {selectedEmployer && (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">Employer</Badge>
                            <span>{selectedEmployer.name_en} / {selectedEmployer.name_ar}</span>
                            {selectedEmployer.crn && (
                              <span className="text-muted-foreground">CRN: {selectedEmployer.crn}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Continue with other sections... */}
              {/* This is a partial implementation showing the enhanced structure */}
              {/* The remaining sections would follow similar patterns with improved UX */}
              
            </motion.div>
          </AnimatePresence>

          {/* Navigation and Submit */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousSection}
              disabled={currentSection === 0}
            >
              Previous
            </Button>

            <div className="flex items-center gap-4">
              {currentSection < CONTRACT_FORM_SECTIONS.length - 1 ? (
                <Button
                  type="button"
                  onClick={goToNextSection}
                >
                  Next Section
                </Button>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="h-12 px-8 text-base font-semibold"
                    disabled={isSubmitting || isLoadingInitialData || formProgress < 80}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="me-2 h-5 w-5 animate-spin" />
                        {contract?.id ? "Updating..." : "Generating..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="me-2 h-5 w-5" />
                        {contract?.id ? "Update Contract" : "Generate Contract"}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Hidden fields for auto-filled data */}
          <div className="hidden">
            <input {...form.register('first_party_name_en')} />
            <input {...form.register('first_party_name_ar')} />
            <input {...form.register('first_party_crn')} />
            <input {...form.register('second_party_name_en')} />
            <input {...form.register('second_party_name_ar')} />
            <input {...form.register('second_party_crn')} />
            <input {...form.register('promoter_name_en')} />
            <input {...form.register('promoter_name_ar')} />
            <input {...form.register('id_card_number')} />
            <input {...form.register('promoter_id_card_url')} />
            <input {...form.register('promoter_passport_url')} />
          </div>
        </form>
      </Form>
    </div>
  )
}
