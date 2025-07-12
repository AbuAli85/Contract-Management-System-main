import { getRequestConfig } from "next-intl/server"

const supportedLocales = ["en", "ar"]

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is supported
  if (!supportedLocales.includes(locale as string)) {
    return {
      locale: "en",
      messages: (await import(`../public/locales/en.json`)).default,
    }
  }

  return {
    locale,
    messages: (await import(`../public/locales/${locale}.json`)).default,
  }
})
