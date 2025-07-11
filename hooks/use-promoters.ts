"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { Promoter } from "@/types/custom"

export type PromoterWithStats = Promoter & {
  active_contracts_count?: number
  total_contracts_count?: number
  document_status?: "valid" | "expiring" | "expired"
  overall_status?: "active" | "warning" | "critical" | "inactive"
}

interface PromotersOptions {
  enableRealtime?: boolean
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

/**
 * Enhanced promoters hook with statistics and status tracking
 */
export const usePromoters = (options: PromotersOptions = {}) => {
  const {
    enableRealtime = true,
    staleTime = 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus = false,
  } = options

  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const queryKey = useMemo(() => ["promoters", user?.id], [user?.id])

  // Enhanced fetch function with statistics
  const fetchPromoters = useCallback(async (): Promise<PromoterWithStats[]> => {
    if (!isAuthenticated) {
      throw new Error("Authentication required")
    }

    const supabase = createClient()

    try {
      // Fetch promoters
      const { data: promotersData, error: promotersError } = await supabase
        .from("promoters")
        .select("*")
        .order("name_en", { ascending: true })

      if (promotersError) {
        throw new Error(`Failed to fetch promoters: ${promotersError.message}`)
      }

      if (!promotersData || promotersData.length === 0) {
        return []
      }

      // Fetch contract counts for each promoter
      const promoterIds = promotersData.map((p) => p.id).filter(Boolean)

      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select("promoter_id, contract_end_date, status")
        .in("promoter_id", promoterIds)

      if (contractsError) {
        console.warn("Error fetching contract data:", contractsError)
      }

      // Enhance promoters with stats
      const enhancedPromoters = promotersData.map((promoter) => {
        const promoterContracts = contractsData?.filter((c) => c.promoter_id === promoter.id) || []
        const activeContracts = promoterContracts.filter(
          (c) =>
            c.contract_end_date &&
            new Date(c.contract_end_date) > new Date() &&
            c.status === "active"
        )

        // Determine document status
        const now = new Date()
        const idCardExpiry = promoter.id_card_expiry_date
          ? new Date(promoter.id_card_expiry_date)
          : null
        const passportExpiry = promoter.passport_expiry_date
          ? new Date(promoter.passport_expiry_date)
          : null

        let documentStatus: "valid" | "expiring" | "expired" = "valid"
        if ((idCardExpiry && idCardExpiry < now) || (passportExpiry && passportExpiry < now)) {
          documentStatus = "expired"
        } else {
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          if (
            (idCardExpiry && idCardExpiry < thirtyDaysFromNow) ||
            (passportExpiry && passportExpiry < thirtyDaysFromNow)
          ) {
            documentStatus = "expiring"
          }
        }

        // Determine overall status
        let overallStatus: "active" | "warning" | "critical" | "inactive" = "inactive"
        if (documentStatus === "expired") {
          overallStatus = "critical"
        } else if (documentStatus === "expiring") {
          overallStatus = "warning"
        } else if (activeContracts.length > 0) {
          overallStatus = "active"
        }

        return {
          ...promoter,
          active_contracts_count: activeContracts.length,
          total_contracts_count: promoterContracts.length,
          document_status: documentStatus,
          overall_status: overallStatus,
        }
      })

      return enhancedPromoters
    } catch (error) {
      console.error("Error fetching promoters:", error)
      throw error
    }
  }, [isAuthenticated])

  // Query with enhanced configuration
  const queryResult = useQuery<PromoterWithStats[], Error>({
    queryKey,
    queryFn: fetchPromoters,
    enabled: isAuthenticated === true,
    staleTime,
    refetchOnWindowFocus,
    retry: 3,
    onError: (error) => {
      toast({
        title: "Error Loading Promoters",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Enhanced realtime subscription
  useEffect(() => {
    if (!enableRealtime || !isAuthenticated) {
      return
    }

    const supabase = createClient()
    let retryCount = 0
    const maxRetries = 3
    let channel: any = null

    const setupSubscription = () => {
      try {
        channel = supabase
          .channel("promoters_realtime")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "promoters" },
            (payload) => {
              queryClient.invalidateQueries({ queryKey })

              if (payload.eventType === "INSERT") {
                toast({
                  title: "New Promoter",
                  description: "A new promoter has been added",
                })
              }
            }
          )
          .subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
              retryCount = 0
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              if (retryCount < maxRetries) {
                retryCount++
                setTimeout(() => {
                  if (channel) {
                    supabase.removeChannel(channel)
                  }
                  setupSubscription()
                }, 2000 * retryCount)
              }
            }
          })

        return channel
      } catch (error) {
        console.error("Error setting up promoters subscription:", error)
        return null
      }
    }

    channel = setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [enableRealtime, isAuthenticated, queryClient, queryKey, toast])

  return queryResult
}

/**
 * Create promoter mutation
 */
export const useCreatePromoterMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (promoterData: Partial<Promoter>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("promoters")
        .insert(promoterData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create promoter: ${error.message}`)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] })
      toast({
        title: "Success",
        description: "Promoter created successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Update promoter mutation
 */
export const useUpdatePromoterMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Promoter> }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("promoters")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update promoter: ${error.message}`)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] })
      toast({
        title: "Success",
        description: "Promoter updated successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Delete promoter mutation
 */
export const useDeletePromoterMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (promoterId: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("promoters").delete().eq("id", promoterId)

      if (error) {
        throw new Error(`Failed to delete promoter: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] })
      toast({
        title: "Success",
        description: "Promoter deleted successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Bulk operations for promoters
 */
export const useBulkPromoterOperations = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const supabase = createClient()
      const { error } = await supabase.from("promoters").update({ status }).in("id", ids)

      if (error) {
        throw new Error(`Failed to update promoters: ${error.message}`)
      }
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] })
      toast({
        title: "Success",
        description: `Updated ${ids.length} promoters successfully`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const supabase = createClient()
      const { error } = await supabase.from("promoters").delete().in("id", ids)

      if (error) {
        throw new Error(`Failed to delete promoters: ${error.message}`)
      }
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] })
      toast({
        title: "Success",
        description: `Deleted ${ids.length} promoters successfully`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  return {
    bulkUpdateStatus,
    bulkDelete,
  }
}
