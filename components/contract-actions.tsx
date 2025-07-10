"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { 
  MoreHorizontal, 
  Edit3, 
  Eye, 
  Download, 
  Send, 
  Archive, 
  Trash2, 
  RefreshCw,
  Copy,
  FileText,
  Calendar,
  Users
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface ContractActionsProps {
  contractId: string
  status: string
  onStatusChange?: () => void
  onDelete?: () => void
}

export function ContractActions({ 
  contractId, 
  status, 
  onStatusChange, 
  onDelete 
}: ContractActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', contractId)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: `Contract status changed to ${newStatus}`,
      })
      
      onStatusChange?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contract status",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId)

      if (error) throw error

      toast({
        title: "Contract Deleted",
        description: "Contract has been permanently deleted",
      })
      
      onDelete?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contract",
        variant: "destructive",
      })
    }
    setShowDeleteDialog(false)
  }

  const handleDuplicate = async () => {
    try {
      const { data: originalContract, error: fetchError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single()

      if (fetchError) throw fetchError
      if (!originalContract) return

      const { id, created_at, updated_at, user_id, ...contractData } = originalContract
      const duplicatedContract = {
        ...contractData,
        user_id: user_id ?? undefined, // Ensure user_id is not null
        status: 'draft',
        contract_name: `${contractData.contract_name || 'Contract'} (Copy)`,
      }

      const { error: insertError } = await supabase
        .from('contracts')
        .insert([duplicatedContract]) // insert expects an array

      if (insertError) throw insertError

      toast({
        title: "Contract Duplicated",
        description: "A copy of the contract has been created",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate contract",
        variant: "destructive",
      })
    }
  }

  const canEdit = ['draft', 'pending_review'].includes(status)
  const canActivate = ['draft', 'pending_review', 'suspended'].includes(status)
  const canSuspend = ['active'].includes(status)
  const canArchive = ['expired', 'terminated'].includes(status)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Contract Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* View Actions */}
          <DropdownMenuItem asChild>
            <Link href={`/contracts/${contractId}`} className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href={`/contracts/${contractId}/pdf`} className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Link>
          </DropdownMenuItem>

          {/* Edit Actions */}
          {canEdit && (
            <DropdownMenuItem asChild>
              <Link href={`/edit-contract/${contractId}`} className="flex items-center">
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Contract
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Contract
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Status Actions */}
          {canActivate && (
            <DropdownMenuItem 
              onClick={() => handleStatusUpdate('active')}
              disabled={isUpdatingStatus}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Activate Contract
            </DropdownMenuItem>
          )}

          {canSuspend && (
            <DropdownMenuItem 
              onClick={() => handleStatusUpdate('suspended')}
              disabled={isUpdatingStatus}
            >
              <Archive className="mr-2 h-4 w-4" />
              Suspend Contract
            </DropdownMenuItem>
          )}

          {canArchive && (
            <DropdownMenuItem 
              onClick={() => handleStatusUpdate('archived')}
              disabled={isUpdatingStatus}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive Contract
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Related Actions */}
          <DropdownMenuItem asChild>
            <Link href={`/contracts/${contractId}/parties`} className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Manage Parties
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/contracts/${contractId}/schedule`} className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              View Schedule
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Danger Zone */}
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Contract
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contract
              and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
