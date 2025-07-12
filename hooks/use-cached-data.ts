import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getContractsWithRelations,
  getPartiesWithContractCounts,
  getContractStatistics,
  searchContracts,
  PaginationOptions,
} from "@/lib/database-utils"
import { handleError } from "@/lib/utils"

export function useContracts(options: PaginationOptions = { page: 1, limit: 10 }) {
  return useQuery({
    queryKey: ["contracts", options],
    queryFn: () => getContractsWithRelations(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => handleError(error, "useContracts"),
  })
}

export function useParties(options: PaginationOptions = { page: 1, limit: 10 }) {
  return useQuery({
    queryKey: ["parties", options],
    queryFn: () => getPartiesWithContractCounts(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => handleError(error, "useParties"),
  })
}

export function useContractStats() {
  return useQuery({
    queryKey: ["contract-stats"],
    queryFn: getContractStatistics,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    onError: (error) => handleError(error, "useContractStats"),
  })
}

export function useContractSearch(
  query: string,
  options: PaginationOptions = { page: 1, limit: 10 }
) {
  return useQuery({
    queryKey: ["contract-search", query, options],
    queryFn: () => searchContracts(query, options),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => handleError(error, "useContractSearch"),
  })
}

// Cache invalidation helpers
export function useCacheInvalidation() {
  const queryClient = useQueryClient()

  return {
    invalidateContracts: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      queryClient.invalidateQueries({ queryKey: ["contract-stats"] })
    },
    invalidateParties: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] })
    },
    invalidateAll: () => {
      queryClient.invalidateQueries()
    },
    clearCache: () => {
      queryClient.clear()
    },
  }
}
