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
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError("File size must be less than 10MB")
      return
    }

    setError(null)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      await onUpload(file)
      setUploadProgress(100)

      setTimeout(() => {
        setUploadProgress(0)
      }, 1000)
    } catch (error) {
      setError("Upload failed. Please try again.")
      setUploadProgress(0)
    }
  }

  const handleRemove = () => {
    // This would typically call an onRemove prop
    setError(null)
    setUploadProgress(0)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>

      {/* Current document display */}
      {currentUrl && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700">Document uploaded</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => window.open(currentUrl, "_blank")}
            >
              <FileImage className="h-4 w-4" />
              View
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div
        className={cn(
          "rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          uploading && "pointer-events-none opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="flex justify-center">
              <Upload className="h-8 w-8 animate-pulse text-blue-500" />
            </div>
            <p className="text-sm text-gray-600">Uploading...</p>
            {uploadProgress > 0 && (
              <Progress value={uploadProgress} className="mx-auto w-full max-w-xs" />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Drop your file here, or{" "}
                <label className="cursor-pointer text-blue-500 underline hover:text-blue-600">
                  browse
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </label>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports: JPEG, PNG, WebP, PDF (max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
