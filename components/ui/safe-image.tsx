"use client"

import Image from "next/image"
import { useState } from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface SafeImageProps {
  src?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  fallback?: React.ReactNode
}

export function SafeImage({ 
  src, 
  alt, 
  width = 40, 
  height = 40, 
  className,
  fallback
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-full",
          width && height ? `w-[${width}px] h-[${height}px]` : "",
          className
        )}
      >
        {fallback || <User className="h-1/2 w-1/2 text-muted-foreground" />}
      </div>
    )
  }

  // Check if the src is a Supabase URL
  const isSupabaseUrl = src.includes('supabase.co')
  
  // For Supabase URLs, use regular img tag to avoid Next.js configuration issues
  if (isSupabaseUrl) {
    return (
      <div className={cn("relative overflow-hidden rounded-full", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "object-cover transition-opacity duration-200 rounded-full",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onError={() => setImageError(true)}
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse rounded-full"
          >
            <User className="h-1/2 w-1/2 text-muted-foreground" />
          </div>
        )}
      </div>
    )
  }

  // For non-Supabase URLs, use Next.js Image component
  return (
    <div className={cn("relative overflow-hidden rounded-full", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-cover transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onError={() => setImageError(true)}
        onLoad={() => setIsLoading(false)}
        priority={false}
      />
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse"
        >
          <User className="h-1/2 w-1/2 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
