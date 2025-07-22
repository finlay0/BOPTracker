import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminPanel from "@/admin-panel"
import type { Winery, User, SupportMessage } from "@/types/admin"

export default async function AdminPage() {
  const supabase = createClient()

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

  // Fetch all data for the admin panel
  const { data: wineries } = await supabase.from("wineries").select("*").order("created_at")
  const { data: users } = await supabase.from("users").select("*").order("created_at")
  const { data: supportMessages } = await supabase
    .from("support_messages")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <AdminPanel
      initialWineries={(wineries as Winery[]) || []}
      initialUsers={(users as User[]) || []}
      initialSupportMessages={(supportMessages as SupportMessage[]) || []}
    />
  )
}
