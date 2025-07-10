"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { deleteParty } from "@/app/actions/parties"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeletePartyButtonProps {
  partyId: string
}

export function DeletePartyButton({ partyId }: DeletePartyButtonProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const t = useTranslations("DeletePartyButton")

  const deleteMutation = useMutation({
    mutationFn: deleteParty,
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: t("successTitle"),
          description: response.message,
        })
        queryClient.invalidateQueries({ queryKey: ["parties"] })
        queryClient.invalidateQueries({ queryKey: ["contracts"] }) // Invalidate contracts as well
      } else {
        toast({
          title: t("errorTitle"),
          description: response.message,
          variant: "destructive",
        })
      }
    },
    onError: (error) => {
      toast({
        title: t("errorTitle"),
        description: error.message || t("unknownError"),
        variant: "destructive",
      })
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate(partyId)
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          <span className="sr-only">{t("delete")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirmDeleteDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
