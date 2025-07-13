import { notFound } from "next/navigation"
import { getRequestConfig } from "next-intl/server"

const locales = ["en", "ar"]

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound()

  try {
    return {
      messages: (await import(`./public/locales/${locale}.json`)).default,
    }
  } catch (error) {
    // Fallback to English if locale file doesn't exist
    return {
      messages: (await import(`./public/locales/en.json`)).default,
    }
  }
})
