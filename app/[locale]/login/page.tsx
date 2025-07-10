import AuthForm from "@/components/auth-form"

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <AuthForm locale={locale} />
    </div>
  )
}
