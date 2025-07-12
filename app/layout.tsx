import { Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ClientProviders } from "@/components/client-providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Contract Management System",
  description: "A modern contract management system",
}

interface RootLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function RootLayout({ children, params: { locale } }: RootLayoutProps) {
  // Validate locale - but don't use notFound() here
  const supportedLocales = ["en", "ar"]
  const validLocale = supportedLocales.includes(locale) ? locale : "en"

  let messages
  try {
    messages = await getMessages({ locale: validLocale })
  } catch (error) {
    // Fallback to English if locale messages can't be loaded
    messages = await getMessages({ locale: "en" })
  }

  return (
    <html lang={validLocale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ClientProviders>
              {children}
              <Toaster />
            </ClientProviders>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
