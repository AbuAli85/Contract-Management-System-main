import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  try {
    return {
      locale,
      messages: (await import(`../messages/${locale}.json`)).default,
    }
  } catch (error) {
    // Fallback to default locale if messages file doesn't exist
    console.warn(
      `Messages for locale ${locale} not found, falling back to ${routing.defaultLocale}`
    )
    return {
      locale: routing.defaultLocale,
      messages: (await import(`../messages/${routing.defaultLocale}.json`)).default,
    }
  }
})
