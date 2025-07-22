// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// SINGLE shared server client factory
export function supabaseServer() {
  return createServerClient(supabaseUrl, supabaseKey, { cookies })
} 