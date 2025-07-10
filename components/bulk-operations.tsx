"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronDown, 
  Archive, 
  Trash2, 
  Download, 
  Send, 
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface ContractForBulkOps {
  id: string;
  status: string;
  first_party_name?: string;
  second_party_name?: string;
  start_date?: string;
  end_date?: string;
  contract_value?: number;
  created_at?: string;
}

interface BulkOperationsProps {
  selectedContracts: string[]
  allContracts: ContractForBulkOps[]
  onSelectionChange: (selected: string[]) => void
  onRefresh: () => void
}

export function BulkOperations({
  selectedContracts,
  allContracts,
  onSelectionChange,
  onRefresh
}: BulkOperationsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [operation, setOperation] = useState<string>("")

  const selectedCount = selectedContracts.length
  const totalCount = allContracts.length
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(allContracts.map(contract => contract.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedContracts.length === 0) return

    setIsProcessing(true)
    setOperation(`Updating ${selectedContracts.length} contracts to ${newStatus}...`)

    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .in('id', selectedContracts)

      if (error) throw error

      toast({
        title: "Bulk Update Successful",
        description: `${selectedContracts.length} contracts updated to ${newStatus}`,
      })

      onSelectionChange([])
      onRefresh()
    } catch (error) {
      toast({
        title: "Bulk Update Failed",
        description: "Some contracts could not be updated",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setOperation("")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedContracts.length === 0) return

    setIsProcessing(true)
    setOperation(`Deleting ${selectedContracts.length} contracts...`)

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .in('id', selectedContracts)

      if (error) throw error

      toast({
        title: "Bulk Delete Successful",
        description: `${selectedContracts.length} contracts deleted`,
      })

      onSelectionChange([])
      onRefresh()
    } catch (error) {
      toast({
        title: "Bulk Delete Failed",
        description: "Some contracts could not be deleted",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setOperation("")
      setShowDeleteDialog(false)
    }
  }

  const handleBulkExport = async () => {
    if (selectedContracts.length === 0) return

    setIsProcessing(true)
    setOperation(`Exporting ${selectedContracts.length} contracts...`)

    try {
      const selectedContractData = allContracts.filter(contract => 
        selectedContracts.includes(contract.id)
      )

      // Create CSV content
      const headers = [
        'ID', 'Party A', 'Party B', 'Status', 'Start Date', 
        'End Date', 'Contract Value', 'Created At'
      ]
      
      const csvContent = [
        headers.join(','),
        ...selectedContractData.map(contract => [
          contract.id,
          contract.first_party_name || '',
          contract.second_party_name || '',
          contract.status || '',
          contract.start_date || '',
          contract.end_date || '',
          contract.contract_value || '',
          contract.created_at || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contracts_export_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `${selectedContracts.length} contracts exported to CSV`,
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export contracts",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setOperation("")
    }
  }

  const getStatusCounts = () => {
    const selectedData = allContracts.filter(contract => 
      selectedContracts.includes(contract.id)
    )
    
    const counts = selectedData.reduce((acc, contract) => {
      const status = contract.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return counts
  }

  if (selectedCount === 0) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isIndeterminate ? "indeterminate" : isAllSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all contracts"
          />
          <span className="text-sm text-muted-foreground">
            Select contracts for bulk operations
          </span>
        </div>
      </div>
    )
  }

  const statusCounts = getStatusCounts()

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={isIndeterminate ? "indeterminate" : isAllSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all contracts"
            className="mr-2"
          />
          <Badge variant="secondary" className="mr-4">
            {selectedCount} selected
          </Badge>

          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge key={status} variant="outline" className="text-xs">
              {status}: {count}
            </Badge>
          ))}
        </div>

        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">{operation}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              Clear Selection
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export ({selectedCount})
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Update Status <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Change Status To:</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('draft')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('pending_review')}>
                  <Clock className="mr-2 h-4 w-4" />
                  Pending Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('active')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('suspended')}>
                  <Archive className="mr-2 h-4 w-4" />
                  Suspended
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('archived')}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedCount})
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} contracts?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected 
              contracts and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedCount} Contracts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
