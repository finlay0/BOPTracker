export interface Winery {
  id: number
  name: string
  location: string
  userCount: number
  status: "active" | "trial" | "inactive"
  accessCode: string
}

export interface User {
  id: number
  email: string
  winery: string
  status: "active" | "inactive"
  lastLogin: string
}

export interface SupportMessage {
  id: number
  winery: string
  user: string
  date: string
  subject: string
  preview: string
  message: string
  status: "open" | "resolved"
}
