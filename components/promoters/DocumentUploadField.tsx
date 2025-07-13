"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ImageIcon, Upload, ExternalLink, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentUploadFieldProps {
  type: "id_card" | "passport" | "profile"
  currentUrl?: string
  onUpload: (file: File) => Promise<void>
  uploading: boolean
  label: string
  required?: boolean
}

export function DocumentUploadField({
  type,
  currentUrl,
  onUpload,
  uploading,
  label,
  required = false,
}: DocumentUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    setPreview(currentUrl || null)
  }, [currentUrl])

  const handleFileSelect = async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
      await onUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 transition-all duration-200",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-gray-300 hover:border-gray-400"
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Uploading...</span>
          </div>
        ) : preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt={label}
              className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setPreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id={`file-${type}`}
              />
              <label htmlFor={`file-${type}`}>
                <Button type="button" variant="secondary" size="sm" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Replace Image
                </Button>
              </label>
            </div>
            {currentUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => window.open(currentUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Drag and drop an image here</p>
              <p className="text-xs text-gray-500">or click to select from your device</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id={`file-${type}`}
              />
              <label htmlFor={`file-${type}`}>
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Select Image
                </Button>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

