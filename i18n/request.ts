import { getRequestConfig } from "next-intl/server"

export default getRequestConfig(async ({ locale }) => {
  // Ensure that a valid locale is used
  if (!locale || !["en", "ar"].includes(locale)) {
    locale = "en"
  }

  return {
    locale,
    messages: (await import(`../../public/locales/${locale}.json`)).default,
  }
})
