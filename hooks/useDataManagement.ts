"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { Database } from "@/types/supabase"

// Enhanced type definitions
export type ContractWithRelations = Database["public"]["Tables"]["contracts"]["Row"] & {
  first_party?: {
    id: string
    name_en: string
    name_ar: string
    crn: string
    type?: "Employer" | "Client" | "Generic" | null
  } | null
  second_party?: {
    id: string
    name_en: string
    name_ar: string
    crn: string
    type?: "Employer" | "Client" | "Generic" | null
  } | null
  promoters?: {
    id: string
    name_en: string
    name_ar: string
    id_card_number: string
    id_card_url?: string | null
    passport_url?: string | null
    status?: string | null
  } | null
}

export type PromoterWithStats = Database["public"]["Tables"]["promoters"]["Row"] & {
  active_contracts_count?: number
  total_contracts_count?: number
  document_status?: 'valid' | 'expiring' | 'expired'
  overall_status?: 'active' | 'warning' | 'critical' | 'inactive'
}

export type PartyWithStats = Database["public"]["Tables"]["parties"]["Row"] & {
  contract_count?: number
  overall_status?: 'active' | 'warning' | 'critical' | 'inactive'
}

interface DataManagementOptions {
  enableRealtime?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnWindowFocus?: boolean
  retryAttempts?: number
}

interface RealtimeSubscription {
  channel: any
  cleanup: () => void
}

/**
 * Enhanced Contracts Hook with comprehensive error handling and optimization
 */
export function useContracts(options: DataManagementOptions = {}) {
  const {
    enableRealtime = true,
    staleTime = 1000 * 60 * 5, // 5 minutes
    cacheTime = 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus = false,
    retryAttempts = 3
  } = options

  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const queryKey = useMemo(() => ["contracts", user?.id], [user?.id])

  // Enhanced fetch function with fallback schema support
  const fetchContracts = useCallback(async (): Promise<ContractWithRelations[]> => {
    if (!isAuthenticated) {
      throw new Error("Authentication required")
    }

    try {
      // Try the new schema first (first_party_id, second_party_id)
      let { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
          second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
          promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
        `)
        .order("created_at", { ascending: false })

      // If the new schema fails, try the old schema (employer_id, client_id)
      if (error && error.message.includes('foreign key')) {
        const { data: oldData, error: oldError } = await supabase
          .from("contracts")
          .select(`
            *,
            first_party:parties!contracts_employer_id_fkey(id,name_en,name_ar,crn,type),
            second_party:parties!contracts_client_id_fkey(id,name_en,name_ar,crn,type),
            promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
          `)
          .order("created_at", { ascending: false })
        
        if (oldError) {
          throw new Error(`Database schema error: ${oldError.message}`)
        }

        data = oldData as any
        error = null
      }

      if (error) {
        throw new Error(`Failed to fetch contracts: ${error.message}`)
      }
      
      return (data as ContractWithRelations[]) || []
    } catch (error) {
      console.error('Error fetching contracts:', error)
      throw error
    }
  }, [isAuthenticated])

  // Query with enhanced configuration
  const queryResult = useQuery<ContractWithRelations[], Error>({
    queryKey,
    queryFn: fetchContracts,
    enabled: isAuthenticated === true,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    retry: retryAttempts,
    onError: (error) => {
      toast({
        title: "Error Loading Contracts",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Enhanced realtime subscription with proper error handling
  useEffect(() => {
    if (!enableRealtime || !isAuthenticated) {
      return
    }

    let subscription: RealtimeSubscription | null = null
    let retryCount = 0
    const maxRetries = 3

    const setupSubscription = () => {
      try {
        const channel = supabase
          .channel("contracts_realtime")
          .on("postgres_changes", 
            { event: "*", schema: "public", table: "contracts" }, 
            (payload) => {
              // Invalidate and refetch contracts data
              queryClient.invalidateQueries({ queryKey })
              
              // Show notification for new contracts
              if (payload.eventType === 'INSERT') {
                toast({
                  title: "New Contract",
                  description: "A new contract has been created",
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
                  if (subscription?.channel) {
                    supabase.removeChannel(subscription.channel)
                  }
                  setupSubscription()
                }, 2000 * retryCount)
              }
            }
          })

        subscription = {
          channel,
          cleanup: () => {
            if (channel) {
              supabase.removeChannel(channel)
            }
          }
        }

        return subscription
      } catch (error) {
        console.error('Error setting up contracts subscription:', error)
        return null
      }
    }

    subscription = setupSubscription()

    return () => {
      if (subscription) {
        subscription.cleanup()
      }
    }
  }, [enableRealtime, isAuthenticated, queryClient, queryKey, toast])

  return queryResult
}

/**
 * Enhanced Promoters Hook with statistics and status tracking
 */
export function usePromoters(options: DataManagementOptions = {}) {
  const {
    enableRealtime = true,
    staleTime = 1000 * 60 * 5,
    cacheTime = 1000 * 60 * 30,
    refetchOnWindowFocus = false,
    retryAttempts = 3
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
      const promoterIds = promotersData.map(p => p.id).filter(Boolean)
      
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select("promoter_id, contract_end_date, status")
        .in("promoter_id", promoterIds)

      if (contractsError) {
        console.warn('Error fetching contract data:', contractsError)
      }

      // Enhance promoters with stats
      const enhancedPromoters = promotersData.map(promoter => {
        const promoterContracts = contractsData?.filter(c => c.promoter_id === promoter.id) || []
        const activeContracts = promoterContracts.filter(c => 
          c.contract_end_date && 
          new Date(c.contract_end_date) > new Date() &&
          c.status === 'active'
        )

        // Determine document status
        const now = new Date()
        const idCardExpiry = promoter.id_card_expiry_date ? new Date(promoter.id_card_expiry_date) : null
        const passportExpiry = promoter.passport_expiry_date ? new Date(promoter.passport_expiry_date) : null
        
        let documentStatus: 'valid' | 'expiring' | 'expired' = 'valid'
        if ((idCardExpiry && idCardExpiry < now) || (passportExpiry && passportExpiry < now)) {
          documentStatus = 'expired'
        } else {
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          if ((idCardExpiry && idCardExpiry < thirtyDaysFromNow) || (passportExpiry && passportExpiry < thirtyDaysFromNow)) {
            documentStatus = 'expiring'
          }
        }

        // Determine overall status
        let overallStatus: 'active' | 'warning' | 'critical' | 'inactive' = 'inactive'
        if (documentStatus === 'expired') {
          overallStatus = 'critical'
        } else if (documentStatus === 'expiring') {
          overallStatus = 'warning'
        } else if (activeContracts.length > 0) {
          overallStatus = 'active'
        }

        return {
          ...promoter,
          active_contracts_count: activeContracts.length,
          total_contracts_count: promoterContracts.length,
          document_status: documentStatus,
          overall_status: overallStatus
        }
      })

      return enhancedPromoters
    } catch (error) {
      console.error('Error fetching promoters:', error)
      throw error
    }
  }, [isAuthenticated])

  // Query with enhanced configuration
  const queryResult = useQuery<PromoterWithStats[], Error>({
    queryKey,
    queryFn: fetchPromoters,
    enabled: isAuthenticated === true,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    retry: retryAttempts,
    onError: (error) => {
      toast({
        title: "Error Loading Promoters",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Enhanced realtime subscription
  useEffect(() => {
    if (!enableRealtime || !isAuthenticated) {
      return
    }

    let subscription: RealtimeSubscription | null = null
    let retryCount = 0
    const maxRetries = 3

    const setupSubscription = () => {
      try {
        const channel = supabase
          .channel("promoters_realtime")
          .on("postgres_changes", 
            { event: "*", schema: "public", table: "promoters" }, 
            (payload) => {
              queryClient.invalidateQueries({ queryKey })
              
              if (payload.eventType === 'INSERT') {
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
                  if (subscription?.channel) {
                    supabase.removeChannel(subscription.channel)
                  }
                  setupSubscription()
                }, 2000 * retryCount)
              }
            }
          })

        subscription = {
          channel,
          cleanup: () => {
            if (channel) {
              supabase.removeChannel(channel)
            }
          }
        }

        return subscription
      } catch (error) {
        console.error('Error setting up promoters subscription:', error)
        return null
      }
    }

    subscription = setupSubscription()

    return () => {
      if (subscription) {
        subscription.cleanup()
      }
    }
  }, [enableRealtime, isAuthenticated, queryClient, queryKey, toast])

  return queryResult
}

/**
 * Enhanced Parties Hook with contract statistics
 */
export function useParties(options: DataManagementOptions = {}) {
  const {
    enableRealtime = true,
    staleTime = 1000 * 60 * 5,
    cacheTime = 1000 * 60 * 30,
    refetchOnWindowFocus = false,
    retryAttempts = 3
  } = options

  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const queryKey = useMemo(() => ["parties", user?.id], [user?.id])

  // Enhanced fetch function with contract counts
  const fetchParties = useCallback(async (): Promise<PartyWithStats[]> => {
    if (!isAuthenticated) {
      throw new Error("Authentication required")
    }

    try {
      // Fetch parties
      const { data: partiesData, error: partiesError } = await supabase
        .from("parties")
        .select("*")
        .order("name_en")

      if (partiesError) {
        throw new Error(`Failed to fetch parties: ${partiesError.message}`)
      }

      if (!partiesData || partiesData.length === 0) {
        return []
      }

      // Fetch contract counts for each party
      const enhancedParties = await Promise.all(
        partiesData.map(async (party) => {
          try {
            const { count: contractCount, error: contractError } = await supabase
              .from("contracts")
              .select("*", { count: "exact", head: true })
              .or(`first_party_id.eq.${party.id},second_party_id.eq.${party.id}`)
              .eq("status", "active")

            if (contractError) {
              console.warn(`Error fetching contracts for party ${party.id}:`, contractError)
            }

            // Determine overall status
            const now = new Date()
            const crExpiry = party.cr_expiry_date ? new Date(party.cr_expiry_date) : null
            const licenseExpiry = party.license_expiry_date ? new Date(party.license_expiry_date) : null
            
            let overallStatus: 'active' | 'warning' | 'critical' | 'inactive' = 'inactive'
            
            if (!party.status || party.status === "Inactive" || party.status === "Suspended") {
              overallStatus = 'inactive'
            } else if ((crExpiry && crExpiry < now) || (licenseExpiry && licenseExpiry < now)) {
              overallStatus = 'critical'
            } else {
              const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
              if ((crExpiry && crExpiry < thirtyDaysFromNow) || (licenseExpiry && licenseExpiry < thirtyDaysFromNow)) {
                overallStatus = 'warning'
              } else if (contractCount && contractCount > 0) {
                overallStatus = 'active'
              }
            }

            return {
              ...party,
              contract_count: contractCount || 0,
              overall_status: overallStatus
            }
          } catch (error) {
            console.warn(`Error processing party ${party.id}:`, error)
            return {
              ...party,
              contract_count: 0,
              overall_status: 'inactive' as const
            }
          }
        })
      )

      return enhancedParties
    } catch (error) {
      console.error('Error fetching parties:', error)
      throw error
    }
  }, [isAuthenticated])

  // Query with enhanced configuration
  const queryResult = useQuery<PartyWithStats[], Error>({
    queryKey,
    queryFn: fetchParties,
    enabled: isAuthenticated === true,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    retry: retryAttempts,
    onError: (error) => {
      toast({
        title: "Error Loading Parties",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Enhanced realtime subscription
  useEffect(() => {
    if (!enableRealtime || !isAuthenticated) {
      return
    }

    let subscription: RealtimeSubscription | null = null
    let retryCount = 0
    const maxRetries = 3

    const setupSubscription = () => {
      try {
        const channel = supabase
          .channel("parties_realtime")
          .on("postgres_changes", 
            { event: "*", schema: "public", table: "parties" }, 
            (payload) => {
              queryClient.invalidateQueries({ queryKey })
              
              if (payload.eventType === 'INSERT') {
                toast({
                  title: "New Party",
                  description: "A new party has been added",
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
                  if (subscription?.channel) {
                    supabase.removeChannel(subscription.channel)
                  }
                  setupSubscription()
                }, 2000 * retryCount)
              }
            }
          })

        subscription = {
          channel,
          cleanup: () => {
            if (channel) {
              supabase.removeChannel(channel)
            }
          }
        }

        return subscription
      } catch (error) {
        console.error('Error setting up parties subscription:', error)
        return null
      }
    }

    subscription = setupSubscription()

    return () => {
      if (subscription) {
        subscription.cleanup()
      }
    }
  }, [enableRealtime, isAuthenticated, queryClient, queryKey, toast])

  return queryResult
}

/**
 * Enhanced mutation hooks with optimistic updates and error handling
 */
export function useCreateContract() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (contractData: any) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          ...contractData,
          user_id: user?.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create contract: ${error.message}`)
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      toast({
        title: "Success",
        description: "Contract created successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

export function useDeleteContract() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (contractId: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId)

      if (error) {
        throw new Error(`Failed to delete contract: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      toast({
        title: "Success",
        description: "Contract deleted successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

/**
 * Utility hook for bulk operations
 */
export function useBulkOperations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const bulkUpdateContracts = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[], updates: any }) => {
      const { error } = await supabase
        .from('contracts')
        .update(updates)
        .in('id', ids)

      if (error) {
        throw new Error(`Failed to update contracts: ${error.message}`)
      }
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      toast({
        title: "Success",
        description: `Updated ${ids.length} contracts successfully`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const bulkDeleteContracts = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .in('id', ids)

      if (error) {
        throw new Error(`Failed to delete contracts: ${error.message}`)
      }
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      toast({
        title: "Success",
        description: `Deleted ${ids.length} contracts successfully`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  return {
    bulkUpdateContracts,
    bulkDeleteContracts
  }
}