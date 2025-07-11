import { createClient } from "@/lib/supabase/server"

export default async function TestAuthPage() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold">Authentication Test</h1>

        {error ? (
          <div className="rounded bg-red-100 p-4">
            <p className="text-red-700">Auth Error: {error.message}</p>
          </div>
        ) : user ? (
          <div className="rounded bg-green-100 p-4">
            <p className="text-green-700">Authenticated as: {user.email}</p>
            <p className="mt-2 text-sm">User ID: {user.id}</p>
          </div>
        ) : (
          <div className="rounded bg-yellow-100 p-4">
            <p className="text-yellow-700">Not authenticated</p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-2 text-xl font-semibold">Environment Check</h2>
          <ul className="space-y-1">
            <li>
              NEXT_PUBLIC_SUPABASE_URL:{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Not set"}
            </li>
            <li>
              NEXT_PUBLIC_SUPABASE_ANON_KEY:{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Not set"}
            </li>
          </ul>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold">Error</h1>
        <pre className="rounded bg-red-100 p-4 text-red-700">{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }
}
