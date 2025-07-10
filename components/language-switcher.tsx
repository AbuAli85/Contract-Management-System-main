"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronDown } from "lucide-react"

// Assuming you have flag SVGs or components. For simplicity, using text.
// Replace with actual flag components/images if available.
const locales = [
  { value: "en", label: "English", flag: "🇺🇸" }, // Placeholder flag
  { value: "ar", label: "العربية", flag: "🇸🇦" }, // Placeholder flag
]

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()

  const segments = pathname ? pathname.split("/") : []
  const currentLocaleValue = segments[1] === "ar" ? "ar" : "en"
  const currentLocale = locales.find((loc) => loc.value === currentLocaleValue) || locales[0]

  const onSelectLocale = (newLocale: string) => {
    if (!pathname) return
    const newPath = `/${newLocale}${pathname.substring(currentLocaleValue.length + 1)}`
    router.push(newPath)
    // router.refresh(); // Consider if refresh is needed for server components
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-x-1.5 px-2">
          {" "}
          {/* RTL: gap-x-1.5 */}
          <span className="text-sm">{currentLocale.flag}</span>
          <span className="hidden text-sm font-medium sm:inline">{currentLocale.label}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.value}
            onClick={() => onSelectLocale(locale.value)}
            className="flex cursor-pointer items-center justify-between"
          >
            <span className="flex items-center gap-x-2">
              {" "}
              {/* RTL: gap-x-2 */}
              <span>{locale.flag}</span>
              {locale.label}
            </span>
            {currentLocaleValue === locale.value && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
