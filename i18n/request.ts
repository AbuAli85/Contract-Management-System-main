import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const supportedLocales = ["en", "ar"];

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale = cookieStore.get("locale")?.value || "en";
  if (!supportedLocales.includes(locale)) {
    locale = "en";
  }
  return {
    locale,
    messages: (await import(`../public/locales/${locale}.json`)).default,
  };
});