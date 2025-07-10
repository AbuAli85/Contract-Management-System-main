"use client"

import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

export default function EditPromoterLoading() {
  const t = useTranslations("Loading")
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="sr-only">{t("loadingPromoter")}</span>
    </div>
  )
}
