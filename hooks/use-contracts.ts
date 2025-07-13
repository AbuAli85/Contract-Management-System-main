"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { createContract, deleteContract } from "@/app/actions/contracts"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { Database } from "@/types/supabase"

// Enhanced contract type with relations
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

export type ContractInsert = Database["public"]["Tables"]["contracts"]["Insert"]

interface ContractsOptions {
  enableRealtime?: boolean
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

/**
 * Enhanced contracts hook with comprehensive error handling and optimization
 */
export const useContracts = (options: ContractsOptions = {}) => {
  const {
    enableRealtime = true,
    staleTime = 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus = false
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
    refetchOnWindowFocus,
    retry: 3,
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

    let retryCount = 0
    const maxRetries = 3
    let channel: any = null

    const setupSubscription = () => {
      try {
        channel = supabase
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
        console.error('Error setting up contracts subscription:', error)
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
 * Enhanced create contract mutation
 */
export const useCreateContractMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<ContractWithRelations, Error, ContractInsert>({
    mutationFn: async (newContract: ContractInsert) => {
      const data = await createContract(newContract)
      return data as ContractWithRelations
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      toast({
        title: "Success",
        description: "Contract created successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create contract: ${error.message}`,
        variant: "destructive",
      })
    }
  })
}

/**
 * Enhanced delete contract mutation
 */
export const useDeleteContractMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<void, Error, string>({
    mutationFn: async (contractId: string) => {
      await deleteContract(contractId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      toast({
        title: "Success",
        description: "Contract deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete contract: ${error.message}`,
        variant: "destructive",
      })
    }
  })
}

/**
 * Bulk operations for contracts
 */
export const useBulkContractOperations = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[], status: string }) => {
      const { error } = await supabase
        .from('contracts')
        .update({ status, updated_at: new Date().toISOString() })
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

  const bulkDelete = useMutation({
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
    bulkUpdateStatus,
    bulkDelete
  }
}
