import './globals.css'
import type React from "react"
import type { Metadata } from "next"
import { MainNav } from "@/components/main-nav"
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: "Bilingual Contract Generator",
  description: "Generate and manage bilingual contracts efficiently.",
  generator: "v0.dev",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let messages
  let locale = 'en'
  try {
    messages = (await import(`../i18n/messages/${locale}.json`)).default
  } catch (error) {
    notFound()
  }
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div>
        <MainNav />
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
