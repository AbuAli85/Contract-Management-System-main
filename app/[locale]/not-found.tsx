"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/navigation"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  const t = useTranslations("NotFoundPage")

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
      <h2 className="mb-4 text-3xl font-semibold">{t("title")}</h2>
      <p className="mb-8 text-lg text-muted-foreground">{t("message")}</p>
      <Button asChild>
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </div>
  )
}
