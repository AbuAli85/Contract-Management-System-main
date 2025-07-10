"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Github, Twitter, Linkedin } from "lucide-react"

export function ClientFooter() {
  const [mounted, setMounted] = useState(false)
  const [currentYear, setCurrentYear] = useState("")

  useEffect(() => {
    setMounted(true)
    setCurrentYear(new Date().getFullYear().toString())
  }, [])

  return (
    <footer className="border-t border-border/40 bg-secondary/50">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-start">
            © {mounted ? currentYear : "2024"} ContractGen. All rights reserved.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  )
}
