import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ContractDetail, ActivityLog, Party } from '@/lib/types'

// Mock activity logs - replace with real data fetch later
const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    action: 'created',
    description: 'Contract was created and initialized',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: '2',
    action: 'generated',
    description: 'Google document was generated successfully',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: '3',
    action: 'reviewed',
    description: 'Contract was reviewed by legal team',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: '4',
    action: 'sent',
    description: 'Contract was sent to parties for review',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: '5',
    action: 'downloaded',
    description: 'PDF document was downloaded',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
]

interface UseContractResult {
  contract: ContractDetail | null
  activityLogs: ActivityLog[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useContract(contractId: string): UseContractResult {
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContract = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use the same query structure as use-contracts.ts
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
        .eq("id", contractId)
        .single()

      // If the new schema fails, try the old schema (employer_id, client_id)
      if (error && error.message.includes('foreign key')) {
        console.log("New schema failed, trying old schema...")
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
          .eq("id", contractId)
          .single()
        
        if (oldError) {
          console.log("Both schemas failed:", oldError)
          throw new Error(oldError.message)
        }
        
        // Instead of directly assigning oldData, validate and transform as with new schema
        if (oldData) {
          const promoter = Array.isArray(oldData.promoters) ? oldData.promoters[0] : oldData.promoters;
          const validParty = (p: any): p is Party => !!p && typeof p === 'object' && 'id' in p && 'name_en' in p && 'name_ar' in p && 'crn' in p;
          const firstPartyOld = validParty(oldData.first_party) ? oldData.first_party : null;
          const secondPartyOld = validParty(oldData.second_party) ? oldData.second_party : null;
          const transformedOldData: any = {
            ...oldData,
            parties: [firstPartyOld, secondPartyOld].filter(Boolean) as Party[],
            promoters: Array.isArray(oldData.promoters) ? oldData.promoters : (oldData.promoters ? [oldData.promoters] : []),
            promoter: promoter || null,
          };
          if (firstPartyOld) transformedOldData.first_party = firstPartyOld;
          if (secondPartyOld) transformedOldData.second_party = secondPartyOld;
          data = transformedOldData;
        } else {
          data = null;
        }
        error = null
      }

      if (error) {
        console.log("Error fetching contract:", error)
        throw new Error(error.message)
      }

      if (data) {
        // Transform the data to match the ContractDetail type
        const promoter = Array.isArray(data.promoters) ? data.promoters[0] : data.promoters;
        // Ensure first_party and second_party are valid Party objects
        const validParty = (p: any): p is Party => !!p && typeof p === 'object' && 'id' in p && 'name_en' in p && 'name_ar' in p && 'crn' in p;
        const firstParty = validParty(data.first_party) ? data.first_party : null;
        const secondParty = validParty(data.second_party) ? data.second_party : null;
        const transformedData = {
          ...data,
          parties: [firstParty, secondParty].filter(Boolean) as Party[],
          first_party: firstParty,
          second_party: secondParty,
          promoters: Array.isArray(data.promoters) ? data.promoters : (data.promoters ? [data.promoters] : []),
          promoter: promoter || null,
        } as unknown as ContractDetail;

        setContract(transformedData);
      } else {
        setContract(null)
      }

      // Mock activity logs for now
      setActivityLogs(mockActivityLogs)
    } catch (err: any) {
      console.error("Detailed fetch error:", err)
      setError(err.message || "An unknown error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    if (contractId) {
      fetchContract()
    }
  }

  useEffect(() => {
    if (contractId) {
      fetchContract()
    }
  }, [contractId])

  return {
    contract,
    activityLogs,
    loading,
    error,
    refetch
  }
}
