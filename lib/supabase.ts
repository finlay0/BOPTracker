import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for server actions)
export const createServerClient = () => {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Database types (updated to match corrected schema)
export type Database = {
  public: {
    Tables: {
      wineries: {
        Row: {
          id: string
          name: string
          join_code: string
          timezone: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          join_code: string
          timezone?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          join_code?: string
          timezone?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          winery_id: string | null
          role: 'owner' | 'manager' | 'staff'
          status: 'active' | 'inactive'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          winery_id?: string | null
          role?: 'owner' | 'manager' | 'staff'
          status?: 'active' | 'inactive'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          winery_id?: string | null
          role?: 'owner' | 'manager' | 'staff'
          status?: 'active' | 'inactive'
          created_at?: string
        }
      }
      winery_bop_sequences: {
        Row: {
          winery_id: string
          last_bop_number: number
        }
        Insert: {
          winery_id: string
          last_bop_number?: number
        }
        Update: {
          winery_id?: string
          last_bop_number?: number
        }
      }
      batches: {
        Row: {
          id: string
          winery_id: string
          bop_number: number
          customer: string
          wine_kit: string
          kit_weeks: 4 | 5 | 6 | 8
          date_of_sale: string
          put_up_date: string
          rack_date: string
          filter_date: string
          bottle_date: string
          status: 'pending' | 'done'
          current_stage: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          winery_id: string
          bop_number: number // Now required, not auto-generated
          customer: string
          wine_kit: string
          kit_weeks: 4 | 5 | 6 | 8
          date_of_sale: string
          put_up_date: string
          rack_date: string
          filter_date: string
          bottle_date: string
          status?: 'pending' | 'done'
          current_stage?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          winery_id?: string
          bop_number?: number
          customer?: string
          wine_kit?: string
          kit_weeks?: 4 | 5 | 6 | 8
          date_of_sale?: string
          put_up_date?: string
          rack_date?: string
          filter_date?: string
          bottle_date?: string
          status?: 'pending' | 'done'
          current_stage?: string
          notes?: string | null
          created_at?: string
        }
      }
      support_messages: {
        Row: {
          id: string
          winery_id: string
          user_id: string
          subject: string
          message: string
          status: 'open' | 'resolved'
          created_at: string
        }
        Insert: {
          id?: string
          winery_id: string
          user_id: string
          subject: string
          message: string
          status?: 'open' | 'resolved'
          created_at?: string
        }
        Update: {
          id?: string
          winery_id?: string
          user_id?: string
          subject?: string
          message?: string
          status?: 'open' | 'resolved'
          created_at?: string
        }
      }
    }
    Functions: {
      generate_join_code: {
        Args: {}
        Returns: string
      }
      get_next_bop_number: {
        Args: { winery_uuid: string }
        Returns: number
      }
      calculate_bottle_date: {
        Args: { filter_date: string }
        Returns: string
      }
    }
  }
} 