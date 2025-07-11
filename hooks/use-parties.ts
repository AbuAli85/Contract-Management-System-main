"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { Party } from "@/lib/types"

export type PartyWithStats = Party & {
  contract_count?: number
  overall_status?: 'active' | 'warning' | 'critical' | 'inactive'
  cr_status?: 'valid' | 'expiring' | 'expired'
  license_status?: 'valid' | 'expiring' | 'expired'
  days_until_cr_expiry?: number
  days_until_license_expiry?: number
}

interface PartiesOptions {
  enableRealtime?: boolean
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

/**
 * Enhanced parties hook with contract statistics and document tracking
 */
export const useParties = (options: PartiesOptions = {}) => {
  const {
    enableRealtime = true,
    staleTime = 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus = false
  } = options

  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const queryKey = useMemo(() => ["parties", user?.id], [user?.id])

  // Enhanced fetch function with contract counts and status calculation
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

            // Calculate document statuses and days until expiry
            const now = new Date()
            const crExpiry = party.cr_expiry_date ? new Date(party.cr_expiry_date) : null
            const licenseExpiry = party.license_expiry_date ? new Date(party.license_expiry_date) : null
            
            const crExpiryDays = crExpiry ? Math.ceil((crExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
            const licenseExpiryDays = licenseExpiry ? Math.ceil((licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

            // Determine document statuses
            const getDocumentStatus = (expiryDays: number | null): 'valid' | 'expiring' | 'expired' => {
              if (expiryDays === null) return 'valid'
              if (expiryDays < 0) return 'expired'
              if (expiryDays <= 30) return 'expiring'
              return 'valid'
            }

            const crStatus = getDocumentStatus(crExpiryDays)
            const licenseStatus = getDocumentStatus(licenseExpiryDays)

            // Determine overall status
            let overallStatus: 'active' | 'warning' | 'critical' | 'inactive' = 'inactive'
            
            if (!party.status || party.status === "Inactive" || party.status === "Suspended") {
              overallStatus = 'inactive'
            } else if (crStatus === 'expired' || licenseStatus === 'expired') {
              overallStatus = 'critical'
            } else if (crStatus === 'expiring' || licenseStatus === 'expiring') {
              overallStatus = 'warning'
            } else if (contractCount && contractCount > 0) {
              overallStatus = 'active'
            }

            return {
              ...party,
              contract_count: contractCount || 0,
              overall_status: overallStatus,
              cr_status: crStatus,
              license_status: licenseStatus,
              days_until_cr_expiry: crExpiryDays || undefined,
              days_until_license_expiry: licenseExpiryDays || undefined
            }
          } catch (error) {
            console.warn(`Error processing party ${party.id}:`, error)
            return {
              ...party,
              contract_count: 0,
              overall_status: 'inactive' as const,
              cr_status: 'valid' as const,
              license_status: 'valid' as const
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
    refetchOnWindowFocus,
    retry: 3,
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

    let retryCount = 0
    const maxRetries = 3
    let channel: any = null

    const setupSubscription = () => {
      try {
        channel = supabase
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
        console.error('Error setting up parties subscription:', error)
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
 * Create party mutation
 */
export const useCreatePartyMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (partyData: Partial<Party>) => {
      const { data, error } = await supabase
        .from('parties')
        .insert(partyData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create party: ${error.message}`)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] })
      toast({
        title: "Success",
        description: "Party created successfully",
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
 * Update party mutation
 */
export const useUpdatePartyMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Party> }) => {
      const { data, error } = await supabase
        .from('parties')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update party: ${error.message}`)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] })
      toast({
        title: "Success",
        description: "Party updated successfully",
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
 * Delete party mutation
 */
export const useDeletePartyMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (partyId: string) => {
      const { error } = await supabase
        .from('parties')
        .delete()
        .eq('id', partyId)

      if (error) {
        throw new Error(`Failed to delete party: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] })
      toast({
        title: "Success",
        description: "Party deleted successfully",
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
 * Bulk operations for parties
 */
export const useBulkPartyOperations = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[], status: "Active" | "Inactive" | "Suspended" }) => {
      const { error } = await supabase
        .from('parties')
        .update({ status })
        .in('id', ids)

      if (error) {
        throw new Error(`Failed to update parties: ${error.message}`)
      }
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ["parties"] })
      toast({
        title: "Success",
        description: `Updated ${ids.length} parties successfully`,
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

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('parties')
        .delete()
        .in('id', ids)

      if (error) {
        throw new Error(`Failed to delete parties: ${error.message}`)
      }
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["parties"] })
      toast({
        title: "Success",
        description: `Deleted ${ids.length} parties successfully`,
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
    bulkUpdateStatus,
    bulkDelete
  }
}

/**
 * Hook for getting parties with expiring documents
 */
export const usePartiesWithExpiringDocuments = (daysAhead: number = 30) => {
  const { data: parties } = useParties()
  
  return useMemo(() => {
    if (!parties) return []
    
    return parties.filter(party => 
      (party.days_until_cr_expiry !== undefined && party.days_until_cr_expiry <= daysAhead && party.days_until_cr_expiry >= 0) ||
      (party.days_until_license_expiry !== undefined && party.days_until_license_expiry <= daysAhead && party.days_until_license_expiry >= 0)
    )
  }, [parties, daysAhead])
}

/**
 * Hook for getting parties statistics
 */
export const usePartiesStats = () => {
  const { data: parties } = useParties()
  
  return useMemo(() => {
    if (!parties) return null
    
    return {
      total: parties.length,
      active: parties.filter(p => p.overall_status === 'active').length,
      warning: parties.filter(p => p.overall_status === 'warning').length,
      critical: parties.filter(p => p.overall_status === 'critical').length,
      inactive: parties.filter(p => p.overall_status === 'inactive').length,
      withContracts: parties.filter(p => (p.contract_count || 0) > 0).length,
      documentsExpiring: parties.filter(p => p.cr_status === 'expiring' || p.license_status === 'expiring').length,
      documentsExpired: parties.filter(p => p.cr_status === 'expired' || p.license_status === 'expired').length,
      byType: parties.reduce((acc, party) => {
        const type = party.type || 'Unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }, [parties])
}