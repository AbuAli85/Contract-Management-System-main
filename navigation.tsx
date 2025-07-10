"use client";

import { createNavigation } from "next-intl/navigation";

export const locales = ["en", "ar"] as const;
export const localePrefix = "always";

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  localePrefix,
});