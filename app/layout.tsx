import './globals.css'
import type React from "react"
import type { Metadata } from "next"
import { Inter, Lexend } from "next/font/google"
import { MainNav } from "@/components/main-nav"
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { ClientProviders } from "@/components/client-providers"
import { cn } from "@/lib/utils"

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const fontLexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  weight: ["400", "500", "600", "700"],
})

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
    <html lang={locale} suppressHydrationWarning>
      <body
        suppressHydrationWarning={true}
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontInter.variable,
          fontLexend.variable
        )}
      >
        <ClientProviders>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <MainNav />
            {children}
          </NextIntlClientProvider>
        </ClientProviders>
      </body>
    </html>
  )
}