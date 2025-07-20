"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient as createSupabaseBrowserClient } from '@/utils/supabase/client'
const supabase = createSupabaseBrowserClient()
import { joinWinery, getUserWinery } from '@/app/actions/auth'

interface WineryInfo {
  id: string
  name: string
  joinCode: string
  timezone: string
}

interface UserInfo {
  id: string
  email: string | undefined
  role: 'owner' | 'manager' | 'staff'
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userInfo: UserInfo | null
  winery: WineryInfo | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  updateEmail: (email: string) => Promise<{ error?: any }>
  updatePassword: (password: string) => Promise<{ error?: any }>
  joinWinery: (joinCode: string) => Promise<{ error?: any }>
  refreshWineryInfo: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [winery, setWinery] = useState<WineryInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Load winery information for authenticated user
  const loadWineryInfo = async () => {
    try {
      const wineryData = await getUserWinery()
      if (wineryData) {
        setUserInfo(wineryData.user)
        setWinery(wineryData.winery)
      } else {
        setUserInfo(null)
        setWinery(null)
      }
    } catch (error) {
      console.error('Failed to load winery info:', error)
      setUserInfo(null)
      setWinery(null)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      // Load winery info if user is authenticated
      if (session?.user) {
        await loadWineryInfo()
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Load winery info if user is authenticated, clear if not
        if (session?.user) {
          await loadWineryInfo()
        } else {
          setUserInfo(null)
          setWinery(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const result = await res.json()
    
    if (res.ok) {
      // Fetch the session after login since our API doesn't return it
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      await loadWineryInfo()
      return { error: null }
    }
    
    return { error: result.error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  const joinWineryAction = async (joinCode: string) => {
    try {
      const result = await joinWinery(joinCode)
      // Refresh winery info after successful join
      await loadWineryInfo()
      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to join winery') }
    }
  }



  const refreshWineryInfo = async () => {
    await loadWineryInfo()
  }

  const value = {
    user,
    session,
    userInfo,
    winery,
    loading,
    signIn,
    signUp,
    signOut,
    updateEmail,
    updatePassword,
    joinWinery: joinWineryAction,
    refreshWineryInfo,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 