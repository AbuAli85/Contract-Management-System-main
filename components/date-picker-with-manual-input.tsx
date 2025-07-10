"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerWithManualInputProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  dateFormat?: string
  placeholder?: string
  disabled?: boolean | ((date: Date) => boolean)
}

export function DatePickerWithManualInput({
  date,
  setDate,
  dateFormat = "dd-MM-yyyy",
  placeholder,
  disabled,
}: DatePickerWithManualInputProps) {
  const [inputValue, setInputValue] = useState<string>("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, dateFormat))
    } else {
      setInputValue("") // Clear input if date is null/undefined or invalid
    }
  }, [date, dateFormat])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    // Try to parse, but only update the parent state if it's a fully valid date string
    // according to the format, or if it's empty.
    if (value === "") {
      setDate(undefined)
      return
    }
    const parsedDate = parse(value, dateFormat, new Date())
    if (isValid(parsedDate) && format(parsedDate, dateFormat) === value) {
      setDate(parsedDate)
    }
    // If partially typed, don't setDate yet, wait for blur or calendar select
  }

  const handleInputBlur = () => {
    const parsedDate = parse(inputValue, dateFormat, new Date())
    if (isValid(parsedDate)) {
      // If input was partial/invalid but parsable, format it correctly
      // and update the parent state.
      const correctlyFormatted = format(parsedDate, dateFormat)
      setInputValue(correctlyFormatted)
      setDate(parse(correctlyFormatted, dateFormat, new Date())) // Re-parse to ensure Date object
    } else if (inputValue !== "") {
      // If input is invalid and not empty, revert to last valid date or clear
      if (date && isValid(date)) {
        setInputValue(format(date, dateFormat))
      } else {
        setInputValue("")
        setDate(undefined)
      }
    } else {
      // Input is empty
      setDate(undefined)
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate) // Update parent state
    if (selectedDate && isValid(selectedDate)) {
      setInputValue(format(selectedDate, dateFormat)) // Update input field
    } else {
      setInputValue("")
    }
    setIsCalendarOpen(false) // Close calendar
    inputRef.current?.focus() // Optionally refocus input
  }

  const isDateDisabled = typeof disabled === "function" ? disabled : () => !!disabled

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <div className="flex items-center gap-x-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder || dateFormat.toUpperCase()}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="w-full" // Ensure it takes available width
          disabled={typeof disabled === "boolean" ? disabled : false}
        />
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn("w-auto shrink-0 p-2", !date && "text-muted-foreground")}
            disabled={typeof disabled === "boolean" ? disabled : false}
            aria-label="Open calendar"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          disabled={isDateDisabled}
        />
      </PopoverContent>
    </Popover>
  )
}
