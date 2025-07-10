import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircleIcon, ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'

interface ErrorCardProps {
  title?: string
  message: string
  showBackButton?: boolean
  onRetry?: () => void
  className?: string
}

export function ErrorCard({ 
  title = "Error Loading Contract",
  message,
  showBackButton = true,
  onRetry,
  className = ""
}: ErrorCardProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 ${className}`}>
      <div className="mx-auto max-w-4xl">
        <Card className="shadow-lg border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-red-600 mb-6">{message}</p>
            <div className="flex gap-3">
              {showBackButton && (
                <Button asChild variant="outline">
                  <Link href="/contracts">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to Contracts
                  </Link>
                </Button>
              )}
              {onRetry && (
                <Button onClick={onRetry}>
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
