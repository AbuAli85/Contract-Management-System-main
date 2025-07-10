"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

interface ErrorBoundaryProps {
  error: Error
  reset: () => void
  title?: string
  description?: string
  showHomeButton?: boolean
}

export default function ErrorBoundary({
  error,
  reset,
  title = "Something went wrong!",
  description = "An unexpected error occurred. Please try again.",
  showHomeButton = true,
}: ErrorBoundaryProps) {
  console.error("Error boundary caught error:", error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl text-slate-800 dark:text-slate-100">
            {title}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Error: {error.message || "Unknown error"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            {showHomeButton && (
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 