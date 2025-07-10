import AuthStatus from "@/components/auth-status"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-3xl font-bold">Welcome to the Contract Management System</h1>
      <AuthStatus />
      <div className="flex gap-4">
        <Link href="/login" className="text-blue-600 underline">Login / Sign Up</Link>
        <Link href="/profile" className="text-blue-600 underline">Profile</Link>
      </div>
    </div>
  )
}
