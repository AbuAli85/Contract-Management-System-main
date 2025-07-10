// File: app/generate-contract/page.tsx
"use client"

import ContractGeneratorForm from "@/components/ContractGeneratorForm"

export default function GenerateContractPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Create New Contract</h1>
      <ContractGeneratorForm />
    </div>
  )
}
