import "../globals.css"
import type React from "react"
import ClientLayout from "../client-layout"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  // Await params before accessing properties
  const { locale } = await params

  // Validate locale - this is safe to use here since it's not the root layout
  const supportedLocales = ["en", "ar"]
  if (!supportedLocales.includes(locale)) {
    notFound()
  }

  let messages
  try {
    messages = await getMessages({ locale })
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    // Fallback to English messages
    messages = await getMessages({ locale: "en" })
  }

  return (
    <div suppressHydrationWarning>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <ClientLayout>{children}</ClientLayout>
      </NextIntlClientProvider>
    </div>
  )
}
