import { DraftContractsManager } from "@/components/draft-contracts-manager"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function DraftContractsPage() {
  return (
    <div className="container max-w-7xl space-y-8 py-8">
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
          <h1 className="text-3xl font-bold">Draft Contracts</h1>
          <p className="text-muted-foreground">Manage contracts pending document generation</p>
        </div>
      </div>

      {/* Troubleshooting Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Troubleshooting:</strong> If document generation fails, check:
          <ul className="ml-4 mt-2 list-disc text-sm">
            <li>Make.com webhook URL is configured in .env.local</li>
            <li>Make.com scenario is active and running</li>
            <li>All contract fields are filled (parties, promoter, dates)</li>
            <li>Check browser console for detailed error messages</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <DraftContractsManager />
    </div>
  )
}
