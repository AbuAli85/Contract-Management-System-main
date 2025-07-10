"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { partyFormSchema, type PartyFormData } from "@/lib/party-schema"
import type { Party } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Building2, Contact, FileText, MapPin } from "lucide-react"
import { DatePickerWithManualInput } from "./date-picker-with-manual-input"

interface PartyFormProps {
  partyToEdit?: Party | null
  onFormSubmit: () => void
}

export default function PartyForm({ partyToEdit, onFormSubmit }: PartyFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PartyFormData>({
    resolver: zodResolver(partyFormSchema),
    defaultValues: {
      name_en: "",
      name_ar: "",
      crn: "",
      type: "Employer",
      role: "",
      status: "Active",
      cr_expiry_date: undefined,
      tax_number: "",
      license_number: "",
      license_expiry_date: undefined,
      contact_person: "",
      contact_phone: "",
      contact_email: "",
      address_en: "",
      address_ar: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (partyToEdit) {
      form.reset({
        name_en: partyToEdit.name_en || "",
        name_ar: partyToEdit.name_ar || "",
        crn: partyToEdit.crn || "",
        type: (partyToEdit.type as "Employer" | "Client") || "Employer",
        role: partyToEdit.role || "",
        cr_expiry_date: partyToEdit.cr_expiry_date ? parseISO(partyToEdit.cr_expiry_date) : undefined,
        contact_person: partyToEdit.contact_person || "",
        contact_email: partyToEdit.contact_email || "",
        contact_phone: partyToEdit.contact_phone || "",
        address_en: partyToEdit.address_en || "",
        address_ar: partyToEdit.address_ar || "",
        tax_number: partyToEdit.tax_number || "",
        license_number: partyToEdit.license_number || "",
        license_expiry_date: partyToEdit.license_expiry_date ? parseISO(partyToEdit.license_expiry_date) : undefined,
        status: (partyToEdit.status as "Active" | "Inactive" | "Suspended") || "Active",
        notes: partyToEdit.notes || "",
      })
    } else {
      form.reset({
        name_en: "",
        name_ar: "",
        crn: "",
        type: "Employer",
        role: "",
        status: "Active",
        cr_expiry_date: undefined,
        tax_number: "",
        license_number: "",
        license_expiry_date: undefined,
        contact_person: "",
        contact_phone: "",
        contact_email: "",
        address_en: "",
        address_ar: "",
        notes: "",
      })
    }
  }, [partyToEdit, form.reset])

  async function onSubmit(values: PartyFormData) {
    setIsSubmitting(true)
    try {
      const partyData: Omit<Party, "id" | "created_at"> = {
        name_en: values.name_en || "",
        name_ar: values.name_ar || "",
        crn: values.crn || "",
        type: values.type as "Employer" | "Client",
        role: values.role || null,
        cr_expiry_date: values.cr_expiry_date ? format(values.cr_expiry_date, 'yyyy-MM-dd') : null,
        contact_person: values.contact_person || null,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
        address_en: values.address_en || null,
        address_ar: values.address_ar || null,
        tax_number: values.tax_number || null,
        license_number: values.license_number || null,
        license_expiry_date: values.license_expiry_date ? format(values.license_expiry_date, 'yyyy-MM-dd') : null,
        status: values.status,
        notes: values.notes || null,
      }

      if (partyToEdit?.id) {
        const { error } = await supabase
          .from("parties")
          .update(partyData)
          .eq("id", partyToEdit.id)
          .select()
        if (error) throw error
        toast({ title: "Success!", description: "Party updated successfully." })
      } else {
        const { error } = await supabase.from("parties").insert(partyData).select()
        if (error) throw error
        toast({ title: "Success!", description: "Party added successfully." })
      }
      onFormSubmit()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-card p-4 text-card-foreground shadow-lg sm:p-6 lg:p-8">
      <h1 className="mb-6 text-center text-2xl font-bold sm:text-3xl">
        {partyToEdit ? "Edit Party" : "Add New Party"}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (English)</FormLabel>
                      <FormControl>
                        <Input placeholder="Party Name (EN)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم (عربي)</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم الطرف (AR)" {...field} dir="rtl" className="text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Employer">Employer</SelectItem>
                          <SelectItem value="Client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CEO, Manager, Director" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Registration & Legal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Registration & Legal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="crn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commercial Registration Number (CRN)</FormLabel>
                      <FormControl>
                        <Input placeholder="1010XXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cr_expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CR Expiry Date</FormLabel>
                      <FormControl>
                        <DatePickerWithManualInput
                          date={field.value}
                          setDate={field.onChange}
                          placeholder="Select expiry date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tax_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Tax registration number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Business license number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="license_expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Expiry Date</FormLabel>
                    <FormControl>
                      <DatePickerWithManualInput
                        date={field.value}
                        setDate={field.onChange}
                        placeholder="Select license expiry date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contact className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name of contact person" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+966 50 XXX XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (English)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Complete address in English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان (عربي)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="العنوان الكامل بالعربية" {...field} dir="rtl" className="text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Any additional information or special requirements for this party.
              </p>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional notes, special requirements, or important information about this party..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {partyToEdit ? "Update Party" : "Add Party"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
