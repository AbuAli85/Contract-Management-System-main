import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { devLog } from "@/lib/dev-log"

export function useRealtimeTable(table: string, onChange: (payload: any) => void) {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // Don't set up realtime if user is not authenticated
    if (!isAuthenticated) {
      return
    }

    let channel: any = null

    try {
      channel = supabase
        .channel(`public:${table}:realtime`)
        .on("postgres_changes", { event: "*", schema: "public", table }, onChange)
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR") {
            const message = err?.message ?? "Unknown channel error"
            devLog(`${table} channel error (${status}): ${message}`)
            
            // Check if it's an authentication error
            if (message.includes("JWT") || message.includes("auth") || message.includes("permission")) {
              devLog(`Authentication error detected for ${table}, will retry after auth check`)
              return
            }
          }
        })
    } catch (error) {
      devLog(`Error setting up ${table} subscription:`, error)
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table, onChange, isAuthenticated])
}
