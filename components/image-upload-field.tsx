"use client"
// CORE INPUT COMPONENT: Does NOT render FormLabel, FormMessage by itself.
// These will be provided by the parent FormField.
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { SafeImage } from "@/components/ui/safe-image"

// Use a direct path string so Next.js doesn't try to read from the filesystem
// during the build phase. Importing the file caused errors like
// `EISDIR: illegal operation on a directory` in some environments.
const placeholderSrc = "/placeholder.svg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Removed Label import from here, will be used from parent
// Removed FormMessage import from here, will be used from parent
import { UploadCloudIcon, Trash2Icon, FileIcon } from "lucide-react"

interface ImageUploadFieldProps {
  field: {
    name: string
    value: File | null | undefined // Value is the File object
    onChange: (file: File | null) => void
    onBlur: () => void
    ref: React.Ref<any> // RHF provides a ref for the input
  }
  initialImageUrl?: string | null
  disabled?: boolean
  onImageRemove?: () => void
  id?: string // To connect with FormLabel from parent
}

export default function ImageUploadField({
  field,
  initialImageUrl,
  disabled,
  onImageRemove,
  id,
}: ImageUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(initialImageUrl || null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null) // Keep this for triggering click

  useEffect(() => {
    if (field.value instanceof File) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(field.value)
      setFileName(field.value.name)
    } else if (initialImageUrl !== preview) {
      setPreview(initialImageUrl || null)
      setFileName(null)
    } else if (!field.value && !initialImageUrl) {
      setPreview(null)
      setFileName(null)
    }
  }, [field.value, initialImageUrl, preview])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    field.onChange(file || null)
  }

  const handleRemoveImage = () => {
    field.onChange(null)
    onImageRemove?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const displayPreviewUrl = field.value instanceof File ? preview : initialImageUrl

  return (
    <div className="space-y-2">
      {/* Label will be rendered by FormLabel in the parent FormField */}
      <div
        className={`group relative flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${disabled ? "cursor-not-allowed bg-muted/50 opacity-50" : "cursor-pointer border-muted-foreground/30 hover:border-primary"}`}
        onClick={triggerFileInput}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) triggerFileInput()
        }}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={`Upload image`} // Generic, specific label will be outside
      >
        {displayPreviewUrl ? (
          <>
            <SafeImage
              src={displayPreviewUrl || placeholderSrc}
              alt={`Preview`}
              className="h-full w-full rounded-md object-contain p-1"
              key={displayPreviewUrl}
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveImage()
                }}
                aria-label={`Remove image`}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            <UploadCloudIcon className="mx-auto mb-2 h-10 w-10" />
            <p className="text-sm">Click or drag file to upload</p>
            <p className="text-xs">PNG, JPG, WEBP up to 5MB</p>
          </div>
        )}
        {/* Hidden file input, RHF ref is passed here */}
        <Input
          ref={field.ref} // Pass RHF's ref to the actual input element
          id={id || field.name} // Use provided id or field.name for label association
          name={field.name} // field.name is important for RHF
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          onBlur={field.onBlur} // Pass onBlur
          className="sr-only"
          disabled={disabled}
        />
      </div>
      {fileName && field.value instanceof File && (
        <div className="flex items-center text-xs text-muted-foreground">
          <FileIcon className="mr-1 h-3 w-3 flex-shrink-0" />
          <span>{fileName}</span>
        </div>
      )}
      {/* FormMessage will be rendered by FormField in the parent */}
    </div>
  )
}
