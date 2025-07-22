"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminPanel from "../../admin-panel"
import { supabase } from "@/utils/supabase/client"

export default function Admin() {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Check if user has admin privileges (you can customize this logic)
        // For now, we'll check if they're an owner or have admin email
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, email')
          .eq('id', user.id)
          .single()

        // Only allow owners or specific admin emails
        const isAdmin = profile?.role === 'owner' || 
                       user.email === 'admin@boptracker.com' ||
                       user.email === 'finlay@example.com' // Add your admin email

        if (!isAdmin) {
          alert('Access denied. Admin privileges required.')
          router.push('/')
          return
        }

        setAuthorized(true)
      } catch (error) {
        console.error('Error checking admin access:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">Admin privileges required</p>
        </div>
      </div>
    )
  }

  return (
    <AdminPanel />
  )
}
