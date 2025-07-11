"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, FileText, Info, Sparkles } from "lucide-react"
import Link from "next/link"
import ContractGeneratorFormWithTemplate from "@/components/contract-generator-form-with-template"

export default function GenerateContractV2Page() {
  const router = useRouter()
  const [showInfo, setShowInfo] = useState(true)

  const handleSuccess = () => {
    router.push("/contracts")
  }

  return (
    <div className="container max-w-5xl space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contracts">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Contracts
              </Link>
            </Button>
          </div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Sparkles className="h-8 w-8 text-primary" />
            Contract Generator
          </h1>
          <p className="text-muted-foreground">
            Create professional contracts with automated document generation
          </p>
        </div>
      </div>

      {/* Info Alert */}
      {showInfo && (
        <Alert className="relative">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong>
            <ol className="ml-4 mt-2 list-decimal space-y-1 text-sm">
              <li>Select a contract template that matches your needs</li>
              <li>Fill in the required fields based on the template</li>
              <li>Submit the form to generate the contract</li>
              <li>The document will be automatically created via Make.com integration</li>
            </ol>
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
            onClick={() => setShowInfo(false)}
          >
            ×
          </Button>
        </Alert>
      )}

      {/* Main Form */}
      <ContractGeneratorFormWithTemplate onSuccess={handleSuccess} />

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Template Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">Available Templates:</h4>
            <div className="grid gap-3 text-sm">
              <div>
                <strong>Standard Employment Contract</strong>
                <p className="text-muted-foreground">
                  For full-time employees with standard terms including salary, benefits, and work
                  location.
                </p>
              </div>
              <div>
                <strong>Service Agreement</strong>
                <p className="text-muted-foreground">
                  For consultants and service providers with deliverables and payment terms.
                </p>
              </div>
              <div>
                <strong>Partnership Agreement</strong>
                <p className="text-muted-foreground">
                  For business partnerships with profit sharing and capital contributions.
                </p>
              </div>
              <div>
                <strong>Freelance Contract</strong>
                <p className="text-muted-foreground">
                  For project-based work with hourly rates and project scope.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Required Fields:</h4>
            <p className="text-sm text-muted-foreground">
              Required fields are marked with a red asterisk (*) and vary based on the selected
              template. The form will only show fields relevant to your chosen template.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
