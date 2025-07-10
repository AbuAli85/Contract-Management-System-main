import { useUserRole } from '../hooks/useUserRole'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function AdminPage() {
  const role = useUserRole()
  const router = useRouter()

  useEffect(() => {
    if (role && role !== 'admin') {
      router.replace('/not-authorized')
    }
  }, [role])

  if (!role) return <div>Loading...</div>
  return <div>Welcome, admin!</div>
} 