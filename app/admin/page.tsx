import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminPanel from "@/admin-panel"
import type { Winery, User, SupportMessage } from "@/types/admin"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userProfile?.role !== "owner") {
    return redirect("/")
  }

  // Debug: Log user info
  console.log("Admin page - User ID:", user.id)
  console.log("Admin page - User role:", userProfile?.role)

  // Fetch all data for the admin panel using RPC functions
  const { data: wineries, error: wineriesError } = await supabase.rpc('admin_get_wineries_with_stats')
  const { data: users, error: usersError } = await supabase.rpc('admin_get_users_with_winery')
  const { data: supportMessages, error: supportError } = await supabase.rpc('admin_get_support_messages')

  // Debug: Log any RPC errors
  if (wineriesError) console.error("Wineries RPC error:", wineriesError)
  if (usersError) console.error("Users RPC error:", usersError)
  if (supportError) console.error("Support RPC error:", supportError)

  return (
    <AdminPanel
      initialWineries={(wineries as Winery[]) || []}
      initialUsers={(users as User[]) || []}
      initialSupportMessages={(supportMessages as SupportMessage[]) || []}
    />
  )
}
