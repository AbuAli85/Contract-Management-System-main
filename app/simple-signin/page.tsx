import SimpleAuthForm from "@/components/simple-auth-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function SimpleSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <SimpleAuthForm />

        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>Having issues? Try these pages:</p>
          <div className="flex justify-center gap-4">
            <Link href="/test-auth" className="text-primary hover:underline">
              Test Auth
            </Link>
            <Link href="/auth/signin" className="text-primary hover:underline">
              Original Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
