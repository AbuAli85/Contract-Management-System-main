import { getRequestConfig } from "next-intl/server"
import { notFound } from "next/navigation"

const locales = ["en", "ar"]

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound()
  }

  try {
    return {
      messages: (await import(`../public/locales/${locale}.json`)).default,
    }
  } catch (error) {
    // Fallback to English if locale file is missing
    console.warn(`Failed to load locale ${locale}, falling back to English`)
    return {
      messages: (await import(`../public/locales/en.json`)).default,
    }
  }
})
