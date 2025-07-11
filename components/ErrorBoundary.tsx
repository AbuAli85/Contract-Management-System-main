"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Report to error tracking service
    this.reportError(error, errorInfo)
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo)
    
    // Show user notification
    toast.error('Something went wrong. Our team has been notified.')
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send to error tracking service (e.g., Sentry)
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: '' })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but something unexpected happened. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Error ID: {this.state.errorId}</p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Technical Details</summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for handling async errors
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context}:`, error)
    
    // Show user-friendly message
    const userMessage = getUserFriendlyMessage(error)
    toast.error(userMessage)
    
    // Report error
    reportErrorToService(error, context)
  }

  return { handleError }
}

// User-friendly error messages
const getUserFriendlyMessage = (error: Error): string => {
  if (error.message.includes('network')) {
    return 'Network connection issue. Please check your internet connection.'
  }
  if (error.message.includes('unauthorized')) {
    return 'You are not authorized to perform this action.'
  }
  if (error.message.includes('validation')) {
    return 'Please check your input and try again.'
  }
  if (error.message.includes('not found')) {
    return 'The requested resource was not found.'
  }
  return 'An unexpected error occurred. Please try again.'
}

// Error reporting service
const reportErrorToService = async (error: Error, context?: string) => {
  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    })
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError)
  }
}