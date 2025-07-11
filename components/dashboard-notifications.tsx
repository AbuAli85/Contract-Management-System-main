import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

interface Notification {
  id: string
  type: string
  message: string
  user_id?: string | null
  created_at: string
  is_read?: boolean | null
}

export default function DashboardNotifications({
  userId,
  isAdmin,
}: {
  userId?: string
  isAdmin?: boolean
}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      let url = "/api/notifications"
      if (!isAdmin && userId) url += `?user_id=${userId}`
      const res = await fetch(url)
      const { notifications } = await res.json()
      setNotifications(notifications)
      setLoading(false)
    }
    fetchNotifications()
  }, [userId, isAdmin])

  if (loading) return <div>Loading notifications...</div>
  if (!notifications.length) return <div>No notifications</div>

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Notifications</h2>
      <ul>
        {notifications.map((n) => (
          <li key={n.id} style={{ fontWeight: n.is_read ? "normal" : "bold" }}>
            {n.message}{" "}
            <span style={{ color: "#888", fontSize: 12 }}>
              ({new Date(n.created_at).toLocaleString()})
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
