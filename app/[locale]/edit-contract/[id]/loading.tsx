// /app/[locale]/edit-contract/[id]/loading.tsx
"use client" // recommended, so you can use hooks or client-side only code

export default function LoadingContractById() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-gray-900" />
    </div>
  )
}
