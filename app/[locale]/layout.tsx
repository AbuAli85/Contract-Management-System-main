import "../globals.css"
import type React from "react"
import ClientLayout from "../client-layout"
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'

export default async function LocaleLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode
  params: { locale: string }
}) {
  let messages
  try {
    messages = (await import(`../../i18n/messages/${params.locale}.json`)).default
  } catch (error) {
    notFound()
  }

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <ClientLayout params={params}>{children}</ClientLayout>
    </NextIntlClientProvider>
  )
}
