import { createServerComponentClient } from "@/lib/supabaseServer"

export async function setUserActiveStatus(
  userId: string,
  isActive: boolean,
  adminId: string,
  ip: string,
  userAgent: string,
) {
  const supabase = await createServerComponentClient()
  if (!supabase) {
    throw new Error("Service unavailable")
  }

  // Update user status
  const { error: updateError } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId)

  if (updateError) {
    throw new Error(`Failed to update user status: ${updateError.message}`)
  }

  // Log the action
  try {
    await supabase.from("audit_logs").insert([
      {
        user_id: adminId,
        action: isActive ? "user_activated" : "user_deactivated",
        resource_type: "user",
        resource_id: userId,
        details: {
          target_user_id: userId,
          new_status: isActive,
          ip_address: ip,
          user_agent: userAgent,
        },
        created_at: new Date().toISOString(),
      },
    ])
  } catch (logError) {
    console.warn("Failed to log user status change:", logError)
  }

  // Create notification
  try {
    await supabase.from("notifications").insert([
      {
        type: isActive ? "user_activated" : "user_deactivated",
        message: `User ${isActive ? "activated" : "deactivated"} by admin`,
        user_id: userId,
        created_at: new Date().toISOString(),
        is_read: false,
      },
    ])
  } catch (notificationError) {
    console.warn("Failed to create notification:", notificationError)
  }
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
  adminId: string,
  ip: string,
  userAgent: string,
) {
  const supabase = await createServerComponentClient()
  if (!supabase) {
    throw new Error("Service unavailable")
  }

  // Note: In a real implementation, you would use Supabase Admin API
  // to reset the password. This is a placeholder implementation.

  // Log the action
  try {
    await supabase.from("audit_logs").insert([
      {
        user_id: adminId,
        action: "password_reset",
        resource_type: "user",
        resource_id: userId,
        details: {
          target_user_id: userId,
          ip_address: ip,
          user_agent: userAgent,
        },
        created_at: new Date().toISOString(),
      },
    ])
  } catch (logError) {
    console.warn("Failed to log password reset:", logError)
  }

  // Create notification
  try {
    await supabase.from("notifications").insert([
      {
        type: "password_reset",
        message: "Your password has been reset by an administrator",
        user_id: userId,
        created_at: new Date().toISOString(),
        is_read: false,
      },
    ])
  } catch (notificationError) {
    console.warn("Failed to create notification:", notificationError)
  }
}
