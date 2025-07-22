"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import BOPTracker from "../bop-tracker"
import { supabase } from "@/utils/supabase/client"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Check if user has completed winery setup
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('winery_id')
          .eq('id', user.id)
          .single()

        if (!profile?.winery_id) {
          router.push('/login')
          return
        }

        setAuthenticated(true)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null // Router will redirect
  }

  return (
    <BOPTracker />
  )
}
