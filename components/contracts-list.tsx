"use client"

import { useEffect } from "react"
import { useContractsStore } from "@/lib/stores/contracts-store"
import { useRealtimeContracts } from "@/hooks/use-realtime-contracts"
import { ContractStatusIndicator } from "./contract-status-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, RotateCcw, Plus } from "lucide-react"
import { toast } from "sonner"

export function ContractsList() {
  const { contracts, fetchContracts, retryContract, generateContract, isLoading } = useContractsStore()

  // Set up real-time subscriptions
  useRealtimeContracts()

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const handleDownload = async (contractId: string, contractName: string) => {
    try {
      // In a real app, this would download the actual PDF
      toast.success(`Downloading ${contractName}`)
    } catch (error) {
      toast.error("Failed to download contract")
    }
  }

  const handleRetry = async (contractId: string) => {
    try {
      await retryContract(contractId)
      toast.success("Contract retry initiated")
    } catch (error) {
      toast.error("Failed to retry contract")
    }
  }

  const handleGenerate = async () => {
    try {
      await generateContract({
        contract_name: `Contract ${Date.now()}`,
        contract_type: "Service Agreement",
        terms: "Standard terms and conditions",
        first_party_id: "partyA-id-placeholder",
        second_party_id: "partyB-id-placeholder",
        promoter_id: "promoter-id-placeholder"
      })
      toast.success("Contract generation started")
    } catch (error) {
      toast.error("Failed to generate contract")
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading contracts...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contracts</CardTitle>
        <Button onClick={handleGenerate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Generate Contract
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">{contract.contract_name}</TableCell>
                <TableCell>
                  <ContractStatusIndicator status={contract.status || "unknown"} />
                </TableCell>
                <TableCell>{new Date(contract.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {contract.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(contract.id, contract.contract_name || "Contract")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {contract.status === "failed" && (
                      <Button variant="outline" size="sm" onClick={() => handleRetry(contract.id)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {contracts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No contracts found. Generate your first contract to get started.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
