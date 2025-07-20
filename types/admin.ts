export interface Winery {
  id: number
  name: string
  location: string
  accessCode: string
  createdAt: string
}

export interface User {
  id: number
  name: string
  email: string
  wineryId: number
  wineryName: string
  createdAt: string
}

export interface SupportMessage {
  id: number
  subject: string
  message: string
  userEmail: string
  wineryName: string
  status: "open" | "resolved"
  createdAt: string
}
