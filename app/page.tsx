import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import BOPTracker from "@/bop-tracker"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select(
      `
      *,
      wineries (
        name,
        join_code
      )
    `,
    )
    .eq("id", user.id)
    .single()

  if (!userProfile) {
    // This might happen if the user was created in auth but the profile trigger failed.
    // You could redirect to a page that asks them to contact support.
    return redirect("/login?error=user_profile_not_found")
  }

  return <BOPTracker userProfile={userProfile} />
}
