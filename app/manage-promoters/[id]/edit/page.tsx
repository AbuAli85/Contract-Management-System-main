"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PromoterForm from "@/components/promoter-form"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { usePromoters } from "@/hooks/use-promoters"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import type { Promoter } from "@/lib/types"

export default function EditPromoterPage() {
  const t = useTranslations("EditPromoterPage")
  const params = useParams()
  const promoterId = params?.id as string

  const { data: promoters, isLoading, isError, error } = usePromoters()
  const [promoterToEdit, setPromoterToEdit] = useState<Promoter | null>(null)

  useEffect(() => {
    if (promoters && promoterId) {
      const foundPromoter = promoters.find((p) => p.id === promoterId)
      if (foundPromoter) {
        setPromoterToEdit(foundPromoter)
      }
    }
  }, [promoters, promoterId])

  if (!promoterId) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-red-500">
        {t("invalidPromoterId")}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="sr-only">{t("loadingPromoter")}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-red-500">
        {t("errorLoading")}: {error?.message || t("unknownError")}
      </div>
    )
  }

  if (!promoterToEdit) {
    return <div className="flex min-h-[80vh] items-center justify-center text-gray-500">{t("promoterNotFound")}</div>
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PromoterForm promoterToEdit={promoterToEdit} onFormSubmit={() => {}} />
        </CardContent>
      </Card>
    </div>
  )
}
