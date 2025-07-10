import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useRef } from "react"
import { supabase, createRealtimeChannel, subscribeToChannel, handleRealtimeError } from "@/lib/supabase"
import { devLog } from "@/lib/dev-log"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { Promoter } from "@/types/custom"

const fetchPromoters = async (): Promise<Promoter[]> => {
  const { data, error } = await supabase
    .from("promoters")
    .select("*")
    .order("name_en", { ascending: true })

  if (error) {
    devLog("Error fetching promoters:", error)
    // Log the complete error object for easier debugging
    devLog(error)
    throw new Error(error.message)
  }
  return data || []
}

export const usePromoters = (enableRealtime: boolean = true) => {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ["promoters"], [])
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const channelRef = useRef<any>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const queryResult = useQuery<Promoter[], Error>({
    queryKey,
    queryFn: fetchPromoters,
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: isAuthenticated !== null, // Only run query when we know auth status
  })

  // --- Realtime subscription ---
  useEffect(() => {
    if (!enableRealtime || isAuthenticated === null) {
      return
    }

    // Don't set up realtime if user is not authenticated
    if (!isAuthenticated) {
      devLog("User not authenticated, skipping realtime subscription for promoters")
      return
    }

    let retryCount = 0
    const maxRetries = 3
    let isSubscribed = false

    const setupSubscription = () => {
      if (isSubscribed) return

      try {
        // Clean up any existing channel first
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }

        // Create channel using utility function
        channelRef.current = createRealtimeChannel("promoters", (payload) => {
          devLog("Realtime promoter change received!", payload)
          queryClient.invalidateQueries({ queryKey: queryKey })
        })

        if (!channelRef.current) {
          devLog("Failed to create promoters channel")
          return
        }

        // Subscribe using utility function
        subscribeToChannel(channelRef.current, (status, err) => {
          if (status === "SUBSCRIBED") {
            devLog("Subscribed to promoters channel!")
            retryCount = 0 // Reset retry count on successful connection
            isSubscribed = true
          }
          if (status === "CHANNEL_ERROR") {
            const errorType = handleRealtimeError(err, "promoters")
            devLog(`Promoters channel error (${status}): ${err?.message ?? "Unknown error"} - Type: ${errorType}`)
            
            // Check if it's an authentication error
            if (errorType === "AUTH_ERROR") {
              devLog("Authentication error detected, will retry after auth check")
              // Don't retry immediately, let the auth state change handler deal with it
              return
            }
              
            // Retry connection if we haven't exceeded max retries
            if (retryCount < maxRetries) {
              retryCount++
              devLog(`Retrying promoters subscription (${retryCount}/${maxRetries})...`)
              retryTimeoutRef.current = setTimeout(() => {
                isSubscribed = false
                setupSubscription()
              }, 2000 * retryCount) // Exponential backoff
            } else {
              devLog("Max retries exceeded for promoters subscription")
              // Don't show toast for realtime errors as they're not critical
            }
          }
          if (status === "TIMED_OUT") {
            devLog(`Subscription timed out (${status})`)
            
            // Retry connection if we haven't exceeded max retries
            if (retryCount < maxRetries) {
              retryCount++
              devLog(`Retrying promoters subscription after timeout (${retryCount}/${maxRetries})...`)
              retryTimeoutRef.current = setTimeout(() => {
                isSubscribed = false
                setupSubscription()
              }, 2000 * retryCount) // Exponential backoff
            } else {
              devLog("Max retries exceeded for promoters subscription after timeout")
              // Don't show toast for realtime errors as they're not critical
            }
          }
        })

        return channelRef.current
      } catch (error) {
        devLog("Error setting up promoters subscription:", error)
        return null
      }
    }

    setupSubscription()

    return () => {
      // Clean up timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      
      // Clean up channel
      isSubscribed = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [isAuthenticated, enableRealtime, queryClient, queryKey, toast])

  return queryResult
}
