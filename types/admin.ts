export interface Winery {
  id: number
  name: string
  join_code: string
  user_count: number
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  role: string
  winery_id: number
  winery_name: string
  created_at: string
}

export interface SupportMessage {
  id: number
  subject: string
  message: string
  status: "open" | "resolved"
  user_id: string
  user_email: string
  user_name: string
  winery_id: number
  winery_name: string
  created_at: string
  updated_at: string
}
