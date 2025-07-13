"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileImage, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentUploadFieldProps {
  type: "id_card" | "passport" | "profile"
  currentUrl?: string | null
  onUpload: (file: File) => Promise<void>
  uploading: boolean
  label: string
  required: boolean
}

export function DocumentUploadField({
  type,
  currentUrl,
  onUpload,
  uploading,
  label,
  required,
}: DocumentUploadFieldProps) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      setError(null)

      const files = Array.from(e.dataTransfer.files)
      if (files.length === 0) return

      const file = files[0]
      await handleFileUpload(file)
    },
    [onUpload]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      const file = files[0]
      await handleFileUpload(file)
    },
    [onUpload]
  )

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG, WebP) or PDF file")
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError("File size must be less than 10MB")
      return
    }

    try {
      setError(null)
      setUploadProgress(0)
      await onUpload(file)
      setUploadProgress(100)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed")
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${type}-upload`}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-4 transition-all duration-200",
          dragOver
            ? "scale-[1.02] border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400",
          uploading && "pointer-events-none opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentUrl ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600">Document uploaded</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(currentUrl, "_blank")}
            >
              View
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <FileImage className="mx-auto h-8 w-8 text-gray-400" />
            <div className="mt-2">
              <Label
                htmlFor={`${type}-upload`}
                className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
              >
                Click to upload or drag and drop
              </Label>
              <p className="text-xs text-gray-500">PNG, JPG, WebP or PDF up to 10MB</p>
            </div>
          </div>
        )}

        <input
          id={`${type}-upload`}
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          disabled={uploading}
        />

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <Upload className="mx-auto h-6 w-6 animate-pulse text-primary" />
              <p className="mt-1 text-sm text-gray-600">Uploading...</p>
              {uploadProgress > 0 && <Progress value={uploadProgress} className="mt-2 w-32" />}
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
