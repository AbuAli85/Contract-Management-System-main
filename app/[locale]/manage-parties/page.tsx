"use client"

import dynamic from "next/dynamic"

// Dynamically import the component to prevent SSR issues
const ManagePartiesContent = dynamic(() => import("./manage-parties-content"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
})

// Party interface
interface Party {
  id: string
  name_en: string
  name_ar: string
  email: string
  phone: string
  address?: string
  type: "individual" | "company"
  status: "active" | "inactive" | "suspended"
  created_at: string
  updated_at?: string
  notes?: string
  crn?: string
  national_id?: string
  contact_person?: string
  website?: string
  industry?: string
  tax_number?: string
  bank_account?: string
  active_contracts_count?: number
  total_contracts_count?: number
  last_contract_date?: string
}

interface FormData {
  name_en: string
  name_ar: string
  email: string
  phone: string
  address: string
  type: "individual" | "company"
  status: "active" | "inactive" | "suspended"
  notes: string
  crn: string
  national_id: string
  contact_person: string
  website: string
  industry: string
  tax_number: string
  bank_account: string
}

interface PartyStats {
  total: number
  active: number
  inactive: number
  suspended: number
  individuals: number
  companies: number
  withActiveContracts: number
  recentlyAdded: number
}

export default function ManagePartiesPage() {
  return <ManagePartiesContent />
}
