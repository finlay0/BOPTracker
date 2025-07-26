"use server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// This admin client can bypass RLS
const createAdminClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function createWinery(formData: FormData) {
  const supabase = createAdminClient()
  const name = formData.get("name") as string
  const location = formData.get("location") as string

  if (!name || !location) {
    return { error: "Name and location are required." }
  }

  const { data, error } = await supabase.rpc('admin_create_winery', {
    name_param: name,
    location_param: location
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { success: true, data: data[0] }
}

export async function updateWinery(wineryId: number, formData: FormData) {
  const supabase = createAdminClient()
  const name = formData.get("name") as string
  const location = formData.get("location") as string

  if (!name || !location) {
    return { error: "Name and location are required." }
  }

  const { error } = await supabase.from("wineries").update({ name, location }).eq("id", wineryId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function deleteWinery(wineryId: number) {
  const supabase = createAdminClient()

  // Supabase is configured with cascading deletes, so deleting a winery
  // will also delete associated users (in public.users) and other related data.
  // We still need to delete the users from auth.users manually.

  const { data: users, error: usersError } = await supabase.from("users").select("id").eq("winery_id", wineryId)

  if (usersError) return { error: usersError.message }

  for (const user of users) {
    await supabase.auth.admin.deleteUser(user.id)
  }

  const { error } = await supabase.from("wineries").delete().eq("id", wineryId)

  if (error) return { error: error.message }

  revalidatePath("/admin")
  return { success: true }
}

export async function createUser(formData: FormData) {
  const supabase = createAdminClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const wineryId = Number(formData.get("wineryId"))

  const { data: wineryData, error: wineryError } = await supabase
    .from("wineries")
    .select("join_code")
    .eq("id", wineryId)
    .single()

  if (wineryError || !wineryData) {
    return { error: "Winery not found." }
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm user
    user_metadata: {
      full_name: name,
      join_code: wineryData.join_code,
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { success: true, data }
}

export async function deleteUser(userId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function toggleSupportMessageStatus(messageId: number, currentStatus: "open" | "resolved") {
  const supabase = createAdminClient()
  const newStatus = currentStatus === "open" ? "resolved" : "open"

  const { error } = await supabase.from("support_messages").update({ status: newStatus }).eq("id", messageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}
