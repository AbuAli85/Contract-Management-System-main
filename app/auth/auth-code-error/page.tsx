export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold">Authentication Error</h1>
        <p className="mb-4 text-muted-foreground">
          There was an error processing your authentication request. This could be due to an expired or invalid link.
        </p>
        <a href="/login" className="text-primary hover:underline">
          Return to login
        </a>
      </div>
    </div>
  )
}