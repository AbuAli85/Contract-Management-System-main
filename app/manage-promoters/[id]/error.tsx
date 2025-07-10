"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { redirect } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("ErrorPage")

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  // Redirect to the default locale version if accessed directly without locale
  redirect("/en/manage-promoters")

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-red-600">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t("errorMessage")}: {error.message}
          </p>
          <Button onClick={() => reset()}>{t("tryAgain")}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
