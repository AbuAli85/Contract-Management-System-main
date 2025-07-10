"use client"

// --- Supabase setup and core utilities ---
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase" // Initialized Supabase client
import { createContract, deleteContract } from "@/app/actions/contracts"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { devLog } from "@/lib/dev-log"
import type { Database } from "@/types/supabase"
import { useEffect } from "react"

// --- Schema definition ---
// Detailed contract type including joined relational data
// This mirrors what the `fetchContracts` query selects
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
// Minimal fields required when creating a new contract
export type ContractInsert = Database["public"]["Tables"]["contracts"]["Insert"]

// --- Queries ---
// Fetch all contracts with their related party and promoter info
const fetchContracts = async (): Promise<ContractWithRelations[]> => {
  // Try the new schema first (first_party_id, second_party_id)
  let { data, error } = await supabase
    .from("contracts")
    .select(
      `
      *,
      first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
      second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
      promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
    `,
    )
    .order("created_at", { ascending: false })

  // If the new schema fails, try the old schema (employer_id, client_id)
  if (error && error.message.includes('foreign key')) {
    devLog("New schema failed, trying old schema...")
    const { data: oldData, error: oldError } = await supabase
      .from("contracts")
      .select(
        `
        *,
        first_party:parties!contracts_employer_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_client_id_fkey(id,name_en,name_ar,crn,type),
        promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
      `,
      )
      .order("created_at", { ascending: false })
    
    if (oldError) {
      devLog("Both schemas failed:", oldError)
      throw new Error(oldError.message)
    }

    data = oldData as any
    error = null
  }

  if (error) {
    devLog("Error fetching contracts:", error)
    throw new Error(error.message)
  }
  
  // Debug: Log the fetched data to see what we're getting
  devLog("📊 Fetched contracts data:", data)
  if (data && data.length > 0) {
    devLog("📊 Sample contract structure:", data[0])
  }
  
  return (data as ContractWithRelations[]) || []
}

export const useContracts = () => {
  const queryClient = useQueryClient()
  const queryKey = ["contracts"]
  const { isAuthenticated } = useAuth()

  // --- Data fetching with React Query ---
  const queryResult = useQuery<ContractWithRelations[], Error>({
    queryKey: queryKey,
    queryFn: fetchContracts,
    enabled: isAuthenticated !== null, // Only run query when we know auth status
  })

  // --- Realtime subscription ---
  useEffect(() => {
    if (isAuthenticated === null) {
      return
    }

    // Don't set up realtime if user is not authenticated
    if (!isAuthenticated) {
      devLog("User not authenticated, skipping realtime subscription for contracts")
      return
    }

    let retryCount = 0
    const maxRetries = 3
    let retryTimeout: NodeJS.Timeout
    let channel: any = null

    const setupSubscription = () => {
      try {
        const newChannel = supabase
          .channel("public-contracts-realtime")
          .on("postgres_changes", { event: "*", schema: "public", table: "contracts" }, (payload) => {
            devLog("Realtime contract change received!", payload)
            queryClient.invalidateQueries({ queryKey: queryKey })
          })
          .subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
              devLog("Subscribed to contracts channel!")
              retryCount = 0 // Reset retry count on successful connection
            }
            if (status === "CHANNEL_ERROR") {
              const message = err?.message ?? "Unknown channel error"
              devLog(`Contracts channel error (${status}): ${message}`)
              
              // Check if it's an authentication error
              if (message.includes("JWT") || message.includes("auth") || message.includes("permission")) {
                devLog("Authentication error detected for contracts, will retry after auth check")
                // Don't retry immediately, let the auth state change handler deal with it
                return
              }
                
              // Retry connection if we haven't exceeded max retries
              if (retryCount < maxRetries) {
                retryCount++
                devLog(`Retrying contracts subscription (${retryCount}/${maxRetries})...`)
                retryTimeout = setTimeout(() => {
                  if (channel) {
                    supabase.removeChannel(channel)
                  }
                  setupSubscription()
                }, 2000 * retryCount) // Exponential backoff
              } else {
                devLog("Max retries exceeded for contracts subscription")
              }
            }
            if (status === "TIMED_OUT") {
              devLog(`Subscription timed out (${status})`)
                
              // Retry connection if we haven't exceeded max retries
              if (retryCount < maxRetries) {
                retryCount++
                devLog(`Retrying contracts subscription after timeout (${retryCount}/${maxRetries})...`)
                retryTimeout = setTimeout(() => {
                  if (channel) {
                    supabase.removeChannel(channel)
                  }
                  setupSubscription()
                }, 2000 * retryCount) // Exponential backoff
              } else {
                devLog("Max retries exceeded for contracts subscription after timeout")
              }
            }
          })

        return newChannel
      } catch (error) {
        devLog("Error setting up contracts subscription:", error)
        return null
      }
    }

    channel = setupSubscription()

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [queryClient, queryKey, isAuthenticated])

  return queryResult
}

// Create a new contract
const createContractInSupabase = async (
  newContract: ContractInsert,
): Promise<ContractWithRelations> => {
  const data = await createContract(newContract)
  return data as ContractWithRelations
}

// --- Form submission: create contract ---
export const useCreateContractMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<ContractWithRelations, Error, ContractInsert>({
    mutationFn: createContractInSupabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
    },
  })
}

// --- Form submission: delete contract ---
const deleteContractInSupabase = async (contractId: string): Promise<void> => {
  await deleteContract(contractId)
}

export const useDeleteContractMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation<void, Error, string>({
    // contractId is a string
    mutationFn: deleteContractInSupabase,
    onSuccess: (_data, contractId) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      // Optionally, for optimistic updates:
      // queryClient.setQueryData(['contracts'], (oldData: ContractWithRelations[] | undefined) =>
      //   oldData ? oldData.filter(contract => contract.id !== contractId) : []
      // );
    },
    onError: (error) => {
      devLog("Error deleting contract:", error)
      toast({
        title: "Error",
        description: `Failed to delete contract: ${error.message}`,
        variant: "destructive",
      })
    },
  })
}

/*
Enhancement Summary:
- Documented Supabase initialization and utilities.
- Added comments for schema types and data fetching queries.
- Explained realtime subscriptions and mutation logic.
- Provided context for create/delete contract operations.
*/
