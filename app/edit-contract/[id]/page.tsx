// Placeholder for Edit Contract Page
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ManualErrorBoundary } from "@/components/ManualErrorBoundary"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeftIcon, Construction } from "lucide-react"

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <ManualErrorBoundary>
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Edit Contract
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Contract ID: <span className="font-mono">{id}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Construction className="mx-auto mb-4 h-16 w-16 text-amber-500" />
            <p className="mb-6 text-slate-600 dark:text-slate-300">
              This page is under construction. Editing functionality will be implemented here.
            </p>
            <Button asChild variant="outline" className="mr-2 inline-block">
              <Link href={`/contracts/${id}`}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Details
              </Link>
            </Button>
            <Button asChild variant="secondary" className="inline-block">
              <Link href="/contracts">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Contracts List
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </ManualErrorBoundary>
  )
}
