// utils/supabase/client.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// SINGLE shared browser client
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)
