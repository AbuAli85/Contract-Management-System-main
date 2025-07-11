import AuthStatus from "@/components/auth-status"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold">Welcome to ContractGen</CardTitle>
          <CardDescription className="text-center text-lg">
            Your all-in-one platform for bilingual contract management, analytics, and automation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <AuthStatus />
            <div className="flex gap-4">
              <Link href="/login" className="text-blue-600 underline">
                Login / Sign Up
              </Link>
              <Link href="/profile" className="text-blue-600 underline">
                Profile
              </Link>
              <Link href="/generate-contract" className="text-blue-600 underline">
                Generate Contract
              </Link>
              <Link href="/contracts" className="text-blue-600 underline">
                View Contracts
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
