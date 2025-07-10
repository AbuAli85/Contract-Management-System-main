"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet" // Assuming Sheet is available

interface NavItem {
  title: string
  href: string
}

interface MobileNavProps {
  navItems: NavItem[]
  locale: string
}

export function MobileNav({ navItems, locale }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="px-2 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-xs pe-0 ps-6 pt-8">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        {" "}
        {/* RTL: pe-6 ps-0 */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href={locale ? `/${locale}` : "/"}
            className="font-heading text-xl font-bold text-primary"
            onClick={() => setIsOpen(false)}
          >
            ContractGen
          </Link>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="me-4">
              {" "}
              {/* RTL: ms-4 */}
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </div>
        <nav className="flex flex-col space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={locale ? `/${locale}${item.href === "/" ? "" : item.href}` : item.href}
              className="py-2 text-lg font-medium text-foreground/80 transition-colors hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
