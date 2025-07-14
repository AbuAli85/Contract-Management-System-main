import ClientLayout from "@/components/client-layout"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ClientNavigation } from "@/components/client-navigation"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: "Contract Management System",
  description: "Manage contracts, parties, and promoters efficiently",
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Define your supported locales
const supportedLocales = ["en", "ar"]

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  // Await params before using
  const { locale } = await params
  
  // Validate locale
  if (!supportedLocales.includes(locale)) {
    notFound()
  }

  // Get messages - this will now use the i18n/request.ts configuration
  let messages
  try {
    messages = await getMessages()
  } catch (error) {
    console.error('Failed to load messages:', error)
    // Fallback to empty messages or redirect to error page
    messages = {}
  }

  return (
    <div lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning className={inter.className}>
      <AuthProvider>
        <ClientNavigation />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
              <ClientLayout>{children}</ClientLayout>
            </div>
          </main>
        </NextIntlClientProvider>
        <Toaster />
      </AuthProvider>
    </div>
  )
}