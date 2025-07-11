"use client"

import { useParams } from "next/navigation"
import { ContractDetailView } from "@/components/contracts/ContractDetailView"

export default function ContractDetailPage() {
  const params = useParams()

  if (!params?.id) {
    return <div>Invalid contract ID</div>
  }

  const contractId = params.id as string

  return <ContractDetailView contractId={contractId} />
}
