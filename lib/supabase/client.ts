import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton browser client to ensure session is loaded once and reused
let supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)

export function createClient() {
  return supabaseClient
}
