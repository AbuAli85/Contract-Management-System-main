import { Card, CardContent } from '@/components/ui/card'

interface LoadingSpinnerProps {
  title?: string
  description?: string
  className?: string
}

export function LoadingSpinner({ 
  title = "Loading Contract Details",
  description = "Please wait while we fetch the contract information...",
  className = ""
}: LoadingSpinnerProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 ${className}`}>
      <div className="mx-auto max-w-4xl">
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
