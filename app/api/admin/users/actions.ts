import { createClient } from "@supabase/supabase-js"
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env"

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export async function setUserActiveStatus(
  userId: string,
  isActive: boolean,
  adminId: string,
  ip?: string,
  userAgent?: string
) {
  // Update user status
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId)
  if (error) throw new Error(error.message)
  // Log to audit_logs
  await supabase.from("audit_logs").insert({
    user_id: adminId,
    action: isActive ? "user_enabled" : "user_disabled",
    entity_type: "user",
    entity_id: userId,
    details: JSON.stringify({ userId, isActive }),
    ip_address: ip || null,
    user_agent: userAgent || null,
  })
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
  adminId: string,
  ip?: string,
  userAgent?: string
) {
  // Use Supabase Admin API to reset password
  const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) throw new Error(error.message)
  // Log to audit_logs
  await supabase.from("audit_logs").insert({
    user_id: adminId,
    action: "user_password_reset",
    entity_type: "user",
    entity_id: userId,
    details: JSON.stringify({ userId }),
    ip_address: ip || null,
    user_agent: userAgent || null,
  })
}
