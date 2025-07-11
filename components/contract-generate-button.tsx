"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ContractGenerateButtonProps {
  contractId: string
  contractNumber: string
  hasDocument?: boolean
  onSuccess?: () => void
  className?: string
}

export function ContractGenerateButton({
  contractId,
  contractNumber,
  hasDocument = false,
  onSuccess,
  className,
}: ContractGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleGenerate = async () => {
    setShowConfirm(false)
    setIsGenerating(true)

    try {
      const response = await fetch(`/api/contracts/generate/${contractId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Generation failed")
      }

      toast({
        title: "Success!",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Contract document is being generated</span>
          </div>
        ),
      })

      // Refresh the page after a delay to show the new document
      setTimeout(() => {
        router.refresh()
        onSuccess?.()
      }, 3000)
    } catch (error) {
      console.error("Generation error:", error)
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error ? error.message : "Failed to generate contract document",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowConfirm(true)}
        disabled={isGenerating}
        variant={hasDocument ? "outline" : "default"}
        className={className}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            {hasDocument ? "Regenerate Document" : "Generate Document"}
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasDocument ? "Regenerate Contract Document?" : "Generate Contract Document?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hasDocument ? (
                <div className="space-y-2">
                  <p>This will create a new version of the contract document.</p>
                  <p className="text-sm text-muted-foreground">Contract: {contractNumber}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>This will generate a PDF document for the contract using the template.</p>
                  <p className="text-sm text-muted-foreground">Contract: {contractNumber}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate}>Generate Document</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
