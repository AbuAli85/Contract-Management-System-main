import "../globals.css"
import type React from "react"
import ClientLayout from "../client-layout"
import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const awaitedParams = await params
  let messages
  try {
    messages = (await import(`../../i18n/messages/${awaitedParams.locale}.json`)).default
  } catch (error) {
    notFound()
  }

  return (
    <NextIntlClientProvider locale={awaitedParams.locale} messages={messages}>
      <ClientLayout locale={awaitedParams.locale}>{children}</ClientLayout>
    </NextIntlClientProvider>
  )
}
