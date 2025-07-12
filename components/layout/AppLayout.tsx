import { EnhancedMainNav } from "@/components/navigation/EnhancedMainNav"
import { ReactNode } from "react"

interface AppLayoutProps {
  children: ReactNode
  className?: string
}

export function AppLayout({ children, className = "" }: AppLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <EnhancedMainNav />
      <main className="flex-1">{children}</main>
    </div>
  )
}
