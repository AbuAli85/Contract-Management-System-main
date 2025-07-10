"use client"
// CORE INPUT COMPONENT: Does NOT render FormItem, FormLabel, FormControl, FormMessage by itself.
import type React from "react"

// These will be provided by the parent FormField.
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format, addYears, startOfToday } from "date-fns"

interface DatePickerWithPresetsFieldProps {
  field: {
    // React Hook Form field object
    name: string
    value: Date | null | undefined
    onChange: (date: Date | null) => void
    onBlur: () => void
    ref: React.Ref<any>
  }
  placeholder?: string
  disabled?: boolean
  disabledCalendar?: (date: Date) => boolean
  presets?: { label: string; date: Date }[]
}

const defaultPresets = [
  { label: "Today", date: startOfToday() },
  { label: "+1Y", date: addYears(startOfToday(), 1) },
  { label: "+2Y", date: addYears(startOfToday(), 2) },
  { label: "+3Y", date: addYears(startOfToday(), 3) },
  { label: "+4Y", date: addYears(startOfToday(), 4) },
  { label: "+5Y", date: addYears(startOfToday(), 5) },
]

export default function DatePickerWithPresetsField({
  field,
  placeholder,
  disabled,
  disabledCalendar,
  presets = defaultPresets,
}: DatePickerWithPresetsFieldProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* FormControl will wrap this Button in the parent component */}
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal", // Ensure justify-start for icon alignment
            !field.value && "text-muted-foreground",
            disabled && "cursor-not-allowed bg-muted/50 opacity-50",
          )}
          disabled={disabled}
          ref={field.ref} // Pass ref to the trigger
        >
          {field.value ? (
            format(new Date(field.value), "PPP")
          ) : (
            <span>{placeholder || "Pick a date"}</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className="w-auto p-0" align="start">
          <div className="grid grid-cols-3 gap-2 border-b p-2">
            {presets.map(({ label: presetLabel, date }) => (
              <Button
                key={presetLabel}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => field.onChange(date)}
                className="h-7 text-xs"
              >
                {presetLabel}
              </Button>
            ))}
          </div>
          <Calendar
            mode="single"
            selected={field.value ? new Date(field.value) : undefined}
            onSelect={(date) => field.onChange(date || null)} // Ensure null is passed if date is undefined
            disabled={disabledCalendar}
            initialFocus
          />
        </PopoverContent>
      )}
    </Popover>
  )
}
