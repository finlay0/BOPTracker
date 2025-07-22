// Re-export standardized clients
export { supabase } from '@/utils/supabase/client'
export { supabaseServer } from '@/utils/supabase/server'

// Database types (updated to match corrected schema)
export type Database = {
  public: {
    Tables: {
      wineries: {
        Row: {
          id: string
          name: string
          join_code: string
          address: string | null
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          join_code?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          join_code?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          winery_id: string | null
          role: 'owner' | 'manager' | 'member'
          dark_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          winery_id?: string | null
          role?: 'owner' | 'manager' | 'member'
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          winery_id?: string | null
          role?: 'owner' | 'manager' | 'member'
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
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
          customer_email: string | null
          wine_kit: string
          kit_weeks: 4 | 5 | 6 | 8
          date_of_sale: string
          put_up_date: string
          rack_date: string
          filter_date: string
          bottle_date: string
          status: 'pending' | 'done'
          current_stage: 'put_up' | 'rack' | 'filter' | 'bottle'
          put_up_completed: boolean
          rack_completed: boolean
          filter_completed: boolean
          bottle_completed: boolean
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          winery_id: string
          bop_number?: number
          customer: string
          customer_email?: string | null
          wine_kit: string
          kit_weeks: 4 | 5 | 6 | 8
          date_of_sale: string
          put_up_date: string
          rack_date?: string
          filter_date?: string
          bottle_date?: string
          status?: 'pending' | 'done'
          current_stage?: 'put_up' | 'rack' | 'filter' | 'bottle'
          put_up_completed?: boolean
          rack_completed?: boolean
          filter_completed?: boolean
          bottle_completed?: boolean
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          winery_id?: string
          bop_number?: number
          customer?: string
          customer_email?: string | null
          wine_kit?: string
          kit_weeks?: 4 | 5 | 6 | 8
          date_of_sale?: string
          put_up_date?: string
          rack_date?: string
          filter_date?: string
          bottle_date?: string
          status?: 'pending' | 'done'
          current_stage?: 'put_up' | 'rack' | 'filter' | 'bottle'
          put_up_completed?: boolean
          rack_completed?: boolean
          filter_completed?: boolean
          bottle_completed?: boolean
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      support_messages: {
        Row: {
          id: string
          winery_id: string
          user_id: string
          subject: string
          message: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          admin_response: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          winery_id: string
          user_id: string
          subject: string
          message: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          admin_response?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          winery_id?: string
          user_id?: string
          subject?: string
          message?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          admin_response?: string | null
          created_at?: string
          updated_at?: string
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
      rpc_validate_join_code: {
        Args: { code: string }
        Returns: string
      }
    }
  }
} 