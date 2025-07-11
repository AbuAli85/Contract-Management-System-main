"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileX,
  Zap,
} from "lucide-react"

interface DraftContract {
  id: string
  contract_number: string
  status: string
  created_at: string
  first_party?: { name_en: string }
  second_party?: { name_en: string }
  promoter?: { name_en: string }
}

export function DraftContractsManager() {
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [contracts, setContracts] = useState<DraftContract[]>([])
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentContract, setCurrentContract] = useState<string | null>(null)

  useEffect(() => {
    fetchDraftContracts()
  }, [])

  const fetchDraftContracts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select(
          `
          id,
          contract_number,
          status,
          created_at,
          first_party:parties!contracts_first_party_id_fkey(name_en),
          second_party:parties!contracts_second_party_id_fkey(name_en),
          promoter:promoters(name_en)
        `
        )
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setContracts(data || [])
    } catch (error) {
      console.error("Error fetching contracts:", error)
      toast({
        title: "Error",
        description: "Failed to load draft contracts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleContract = (contractId: string) => {
    setSelectedContracts((prev) =>
      prev.includes(contractId) ? prev.filter((id) => id !== contractId) : [...prev, contractId]
    )
  }

  const toggleAll = () => {
    if (selectedContracts.length === contracts.length) {
      setSelectedContracts([])
    } else {
      setSelectedContracts(contracts.map((c) => c.id))
    }
  }

  const generateDocuments = async () => {
    if (selectedContracts.length === 0) {
      toast({
        title: "No contracts selected",
        description: "Please select at least one contract to generate documents",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    setProgress(0)

    const total = selectedContracts.length
    let completed = 0
    let failed = 0

    for (const contractId of selectedContracts) {
      const contract = contracts.find((c) => c.id === contractId)
      if (!contract) continue

      setCurrentContract(contract.contract_number)

      try {
        const response = await fetch(`/api/contracts/generate/${contractId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Generation failed")
        }

        completed++
      } catch (error) {
        failed++
        console.error(`Failed to generate ${contract.contract_number}:`, error)
      }

      setProgress(((completed + failed) / total) * 100)

      // Wait between requests
      if (completed + failed < total) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    setGenerating(false)
    setCurrentContract(null)
    setSelectedContracts([])

    toast({
      title: "Bulk generation complete",
      description: `Successfully generated ${completed} documents. ${failed} failed.`,
      variant: completed > 0 ? "default" : "destructive",
    })

    // Refresh the list
    fetchDraftContracts()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileX className="h-5 w-5" />
                Draft Contracts Manager
              </CardTitle>
              <CardDescription>Manage and generate documents for draft contracts</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDraftContracts} disabled={generating}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Draft</p>
                      <p className="text-2xl font-bold">{contracts.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Selected</p>
                      <p className="text-2xl font-bold">{selectedContracts.length}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Button
                    className="w-full"
                    onClick={generateDocuments}
                    disabled={generating || selectedContracts.length === 0}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Selected
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            {generating && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Generating documents... {Math.round(progress)}% complete</p>
                    {currentContract && (
                      <p className="text-sm text-muted-foreground">Processing: {currentContract}</p>
                    )}
                    <Progress value={progress} className="h-2" />
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Contracts Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedContracts.length === contracts.length && contracts.length > 0
                        }
                        onCheckedChange={toggleAll}
                        disabled={generating}
                      />
                    </TableHead>
                    <TableHead>Contract Number</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Promoter</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No draft contracts found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedContracts.includes(contract.id)}
                            onCheckedChange={() => toggleContract(contract.id)}
                            disabled={generating}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{contract.contract_number}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{contract.first_party?.name_en || "N/A"}</p>
                            <p className="text-muted-foreground">
                              {contract.second_party?.name_en || "N/A"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{contract.promoter?.name_en || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(contract.created_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{contract.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Select contracts and click "Generate Selected" to create documents via Make.com.
                Documents will be generated with a 2-second delay between each to avoid overwhelming
                the system.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
