"use client"

import React from "react"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Loading Spinner Component
export const LoadingSpinner = ({
  size = "default",
  className,
}: {
  size?: "sm" | "default" | "lg"
  className?: string
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
}

// Skeleton Components
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}

export const ContractCardSkeleton = () => (
  <div className="space-y-4 rounded-lg border p-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-5 w-20" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="flex justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
)

export const FormSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <Skeleton className="h-10 w-32" />
  </div>
)

// Loading States Hook
export const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({})

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }))
  }

  const isLoading = (key: string) => loadingStates[key] || false

  return { setLoading, isLoading, loadingStates }
}

// Progress Indicator
export const ProgressIndicator = ({
  progress,
  label,
  showPercentage = true,
}: {
  progress: number
  label?: string
  showPercentage?: boolean
}) => (
  <div className="space-y-2">
    {label && (
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        {showPercentage && <span>{Math.round(progress)}%</span>}
      </div>
    )}
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-2 rounded-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
)

// Status Indicator
export const StatusIndicator = ({
  status,
  message,
}: {
  status: "loading" | "success" | "error"
  message?: string
}) => {
  const icons = {
    loading: <LoadingSpinner size="sm" />,
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    error: <AlertCircle className="h-4 w-4 text-red-600" />,
  }

  const colors = {
    loading: "text-muted-foreground",
    success: "text-green-600",
    error: "text-red-600",
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm", colors[status])}>
      {icons[status]}
      {message && <span>{message}</span>}
    </div>
  )
}

// Loading Overlay
export const LoadingOverlay = ({
  isLoading,
  message = "Loading...",
  children,
}: {
  isLoading: boolean
  message?: string
  children: React.ReactNode
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    )}
  </div>
)
