"use client"
import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { promoterProfileSchema, type PromoterProfileFormData, type PromoterStatus } from "@/lib/promoter-profile-schema"
import { promoterStatusesList } from "@/types/custom"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel as ShadcnFormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Edit3Icon, LockIcon, FileWarningIcon as WarningIcon } from "lucide-react"
import type { Promoter } from "@/lib/types"
import { format, parseISO, differenceInDays, isPast, isValid } from "date-fns"
import ImageUploadField from "@/components/image-upload-field"
import DatePickerWithPresetsField from "@/components/date-picker-with-presets-field"
import { ComboboxField } from "@/components/combobox-field"
import { cn } from "@/lib/utils"

const BUCKET_NAME = "promoter-documents"

interface PromoterFormProps {
  promoterToEdit?: Promoter | null
  onFormSubmit: () => void
}

// Helper for expiry alerts
const getExpiryAlert = (
  dateString: string | Date | null | undefined,
  alertDays: number | null | undefined,
  itemName: string,
): { message: string; className: string } | null => {
  if (!dateString || !alertDays || alertDays <= 0) return null

  const date = dateString instanceof Date ? dateString : parseISO(dateString as string)
  if (!isValid(date)) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize today to start of day for consistent comparison

  const daysToExpiry = differenceInDays(date, today)

  if (isPast(date)) {
    return {
      message: `🚫 ${itemName} expired on ${format(date, "MMM d, yyyy")}`,
      className: "text-red-600 dark:text-red-500",
    }
  }
  if (daysToExpiry <= alertDays) {
    return {
      message: `⚠️ ${itemName} expires in ${daysToExpiry} day${daysToExpiry === 1 ? "" : "s"} (on ${format(date, "MMM d, yyyy")})`,
      className: "text-amber-600 dark:text-amber-500",
    }
  }
  return null
}

export default function PromoterForm({ promoterToEdit, onFormSubmit }: PromoterFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditScreen = !!promoterToEdit
  const [isEditable, setIsEditable] = useState(!isEditScreen)

  const form = useForm<PromoterProfileFormData>({
    resolver: zodResolver(promoterProfileSchema),
    defaultValues: {
      name_en: "",
      name_ar: "",
      id_card_number: "",
      id_card_image: null,
      passport_image: null,
      existing_id_card_url: null,
      existing_passport_url: null,
      id_card_expiry_date: null,
      passport_expiry_date: null,
      status: "active",
      notify_days_before_id_expiry: 30,
      notify_days_before_passport_expiry: 90,
      notes: "",
    },
  })

  // Watch relevant fields for expiry alerts
  const idCardExpiryDate = useWatch({ control: form.control, name: "id_card_expiry_date" })
  const notifyIdDays = useWatch({ control: form.control, name: "notify_days_before_id_expiry" })
  const passportExpiryDate = useWatch({ control: form.control, name: "passport_expiry_date" })
  const notifyPassportDays = useWatch({
    control: form.control,
    name: "notify_days_before_passport_expiry",
  })

  const idCardAlert = getExpiryAlert(idCardExpiryDate, notifyIdDays, "ID Card")
  const passportAlert = getExpiryAlert(passportExpiryDate, notifyPassportDays, "Passport")

  useEffect(() => {
    if (promoterToEdit) {
      form.reset({
        name_en: promoterToEdit.name_en || "",
        name_ar: promoterToEdit.name_ar || "",
        id_card_number: promoterToEdit.id_card_number || "",
        id_card_image: null,
        passport_image: null,
        existing_id_card_url: promoterToEdit.id_card_url || null,
        existing_passport_url: promoterToEdit.passport_url || null,
        id_card_expiry_date: promoterToEdit.id_card_expiry_date
          ? parseISO(promoterToEdit.id_card_expiry_date)
          : null,
        passport_expiry_date: promoterToEdit.passport_expiry_date
          ? parseISO(promoterToEdit.passport_expiry_date)
          : null,
        status: (promoterToEdit.status as PromoterStatus) || "active",
        notify_days_before_id_expiry: promoterToEdit.notify_days_before_id_expiry ?? 30,
        notify_days_before_passport_expiry: promoterToEdit.notify_days_before_passport_expiry ?? 90,
        notes: promoterToEdit.notes || "",
      })
    } else {
      form.reset({
        name_en: "",
        name_ar: "",
        id_card_number: "",
        id_card_image: null,
        passport_image: null,
        existing_id_card_url: null,
        existing_passport_url: null,
        id_card_expiry_date: null,
        passport_expiry_date: null,
        status: "active",
        notify_days_before_id_expiry: 30,
        notify_days_before_passport_expiry: 90,
        notes: "",
      })
    }
  }, [promoterToEdit, form.reset])

  const uploadFile = async (
    file: File | null | undefined,
    currentUrl?: string | null | undefined,
  ): Promise<string | null | undefined> => {
    if (file) {
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, "_")}`
      const filePath = `${fileName}`

      if (currentUrl) {
        try {
          const oldFileName = currentUrl.substring(currentUrl.lastIndexOf("/") + 1)
          await supabase.storage.from(BUCKET_NAME).remove([oldFileName])
        } catch (e) {
          console.warn("Could not remove old file from storage:", e)
        }
      }

      const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file)
      if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`)
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)
      return urlData.publicUrl
    }
    return currentUrl
  }

  async function onSubmit(values: PromoterProfileFormData) {
    if (!isEditable) {
      toast({
        title: "Form Locked",
        description: "Enable 'Editable Mode' to make changes.",
        variant: "default",
      })
      return
    }
    setIsSubmitting(true)
    try {
      let idCardUrlResult = values.existing_id_card_url
      if (values.id_card_image instanceof File) {
        idCardUrlResult = await uploadFile(values.id_card_image, values.existing_id_card_url)
      } else if (!values.existing_id_card_url) {
        idCardUrlResult = null
      }

      let passportUrlResult = values.existing_passport_url
      if (values.passport_image instanceof File) {
        passportUrlResult = await uploadFile(values.passport_image, values.existing_passport_url)
      } else if (!values.existing_passport_url) {
        passportUrlResult = null
      }

      const promoterData = {
        name_en: values.name_en,
        name_ar: values.name_ar,
        id_card_number: values.id_card_number,
        id_card_url: idCardUrlResult,
        passport_url: passportUrlResult,
        id_card_expiry_date: values.id_card_expiry_date
          ? format(values.id_card_expiry_date, "yyyy-MM-dd")
          : null,
        passport_expiry_date: values.passport_expiry_date
          ? format(values.passport_expiry_date, "yyyy-MM-dd")
          : null,
        status: values.status,
        notify_days_before_id_expiry: values.notify_days_before_id_expiry,
        notify_days_before_passport_expiry: values.notify_days_before_passport_expiry,
        notes: values.notes,
      }

      if (promoterToEdit?.id) {
        const { error } = await supabase
          .from("promoters")
          .update(promoterData)
          .eq("id", promoterToEdit.id)
          .select()
        if (error) throw error
        toast({ title: "Success!", description: "Promoter updated successfully." })
      } else {
        const { error } = await supabase.from("promoters").insert([promoterData]).select()
        if (error) throw error
        toast({ title: "Success!", description: "Promoter added successfully." })
      }
      onFormSubmit()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formActuallyDisabled = !isEditable || isSubmitting

  const sectionClasses =
    "space-y-6 p-5 border rounded-lg shadow-sm bg-card-foreground/5 dark:bg-card-foreground/5"
  const sectionHeaderClasses =
    "text-xl font-semibold text-foreground border-b border-border pb-3 mb-6"

  return (
    <div className="mx-auto max-w-3xl rounded-lg bg-card p-4 text-card-foreground shadow-xl sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {promoterToEdit ? "Edit Promoter / تعديل المروج" : "Add New Promoter / إضافة مروج جديد"}
        </h1>
        <div className="flex items-center space-x-3">
          {isEditable ? (
            <Edit3Icon className="h-5 w-5 text-primary" />
          ) : (
            <LockIcon className="h-5 w-5 text-muted-foreground" />
          )}
          <Switch
            id="editable-mode"
            checked={isEditable}
            onCheckedChange={setIsEditable}
            aria-label="Toggle editable mode"
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
          />
          <Label htmlFor="editable-mode" className="cursor-pointer select-none text-sm font-medium">
            {isEditable ? "Editable Mode / وضع التعديل" : "Locked / مقفل"}
          </Label>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          {/* Personal Information Section */}
          <div className={sectionClasses}>
            <h2 className={sectionHeaderClasses}>Personal Information / المعلومات الشخصية</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>Name (English)</ShadcnFormLabel>
                    <FormControl>
                      <Input
                        placeholder="Promoter Name (EN)"
                        {...field}
                        disabled={formActuallyDisabled}
                      />
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
                    <ShadcnFormLabel>الاسم (عربي)</ShadcnFormLabel>
                    <FormControl>
                      <Input
                        placeholder="اسم المروج (AR)"
                        {...field}
                        dir="rtl"
                        className="text-right"
                        disabled={formActuallyDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="id_card_number"
              render={({ field }) => (
                <FormItem>
                  <ShadcnFormLabel>ID Card Number / رقم البطاقة الشخصية</ShadcnFormLabel>
                  <FormControl>
                    <Input placeholder="1029384756" {...field} disabled={formActuallyDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Employment Details Section */}
          <div className={sectionClasses}>
            <h2 className={sectionHeaderClasses}>Employment Details / تفاصيل التوظيف</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>Status / الحالة</ShadcnFormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={formActuallyDisabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {promoterStatusesList.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Documents Section */}
          <div className={sectionClasses}>
            <h2 className={sectionHeaderClasses}>Documents / المستندات</h2>
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
              <FormField
                control={form.control}
                name="id_card_image"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel htmlFor={field.name}>
                      ID Card Image / صورة البطاقة
                    </ShadcnFormLabel>
                    <FormControl>
                      <ImageUploadField
                        id={field.name}
                        field={field}
                        initialImageUrl={form.watch("existing_id_card_url")}
                        disabled={formActuallyDisabled}
                        onImageRemove={() => {
                          form.setValue("existing_id_card_url", null)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="id_card_expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>ID Card Expiry Date / تاريخ انتهاء البطاقة</ShadcnFormLabel>
                    <FormControl>
                      <DatePickerWithPresetsField
                        field={field}
                        placeholder="Select ID expiry"
                        disabled={formActuallyDisabled}
                      />
                    </FormControl>
                    {idCardAlert && !form.formState.errors.id_card_expiry_date && (
                      <p
                        className={cn(
                          "mt-1.5 flex items-center text-xs font-medium",
                          idCardAlert.className,
                        )}
                      >
                        <WarningIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />{" "}
                        {idCardAlert.message}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passport_image"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel htmlFor={field.name}>
                      Passport Image / صورة الجواز
                    </ShadcnFormLabel>
                    <FormControl>
                      <ImageUploadField
                        id={field.name}
                        field={field}
                        initialImageUrl={form.watch("existing_passport_url")}
                        disabled={formActuallyDisabled}
                        onImageRemove={() => {
                          form.setValue("existing_passport_url", null)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passport_expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>Passport Expiry Date / تاريخ انتهاء الجواز</ShadcnFormLabel>
                    <FormControl>
                      <DatePickerWithPresetsField
                        field={field}
                        placeholder="Select passport expiry"
                        disabled={formActuallyDisabled}
                      />
                    </FormControl>
                    {passportAlert && !form.formState.errors.passport_expiry_date && (
                      <p
                        className={cn(
                          "mt-1.5 flex items-center text-xs font-medium",
                          passportAlert.className,
                        )}
                      >
                        <WarningIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />{" "}
                        {passportAlert.message}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Notification Settings Section */}
          <div className={sectionClasses}>
            <h2 className={sectionHeaderClasses}>Notification Settings / إعدادات الإشعارات</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
              <FormField
                control={form.control}
                name="notify_days_before_id_expiry"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>
                      ID Expiry Alert (Days) / تنبيه انتهاء البطاقة (أيام)
                    </ShadcnFormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 30"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                          )
                        }
                        disabled={formActuallyDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notify_days_before_passport_expiry"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>
                      Passport Expiry Alert (Days) / تنبيه انتهاء الجواز (أيام)
                    </ShadcnFormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 90"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                          )
                        }
                        disabled={formActuallyDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Notes Section */}
          <div className={sectionClasses}>
            <h2 className={sectionHeaderClasses}>Notes / ملاحظات</h2>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <ShadcnFormLabel>Internal Notes / ملاحظات داخلية</ShadcnFormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal notes about this promoter..."
                      className="min-h-[120px] resize-y"
                      {...field}
                      value={field.value ?? ""}
                      disabled={formActuallyDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={formActuallyDisabled || isSubmitting}
              className="min-w-[200px] py-3 text-base font-semibold"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : promoterToEdit ? (
                "Update Promoter / تحديث المروج"
              ) : (
                "Add Promoter / إضافة مروج"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
