'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ManualErrorBoundaryProps {
  children: React.ReactNode
}

interface ManualErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ManualErrorBoundary extends React.Component<ManualErrorBoundaryProps, ManualErrorBoundaryState> {
  constructor(props: ManualErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ManualErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-600">Something went wrong!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We're sorry, but an unexpected error occurred.
              </p>
              {this.state.error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-semibold">Error Details:</p>
                  <pre className="whitespace-pre-wrap break-all text-left">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              <Button onClick={() => this.setState({ hasError: false, error: null })}>
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
