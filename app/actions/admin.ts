'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Admin authentication check
async function requireAdmin() {
  const supabase = createServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  // Check if user is admin
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
  
  if (adminError || !isAdmin) {
    throw new Error('Access denied: Admin privileges required')
  }
  
  return user
}

// Get admin user info
export async function getAdminUser() {
  await requireAdmin()
  const supabase = createServerClient()
  
  const { data, error } = await supabase.rpc('get_admin_user')
  
  if (error) {
    throw new Error('Failed to get admin user info')
  }
  
  return data[0]
}

// Get all wineries with stats
export async function getAllWineries() {
  await requireAdmin()
  const supabase = createServerClient()
  
  const { data, error } = await supabase.rpc('admin_get_all_wineries')
  
  if (error) {
    throw new Error('Failed to get wineries')
  }
  
  return data
}

// Get all users across wineries
export async function getAllUsers() {
  await requireAdmin()
  const supabase = createServerClient()
  
  const { data, error } = await supabase.rpc('admin_get_all_users')
  
  if (error) {
    throw new Error('Failed to get users')
  }
  
  return data
}

// Get all support messages
export async function getAllSupportMessages() {
  await requireAdmin()
  const supabase = createServerClient()
  
  const { data, error } = await supabase.rpc('admin_get_support_messages')
  
  if (error) {
    throw new Error('Failed to get support messages')
  }
  
  return data
}

// Create new winery
export async function createWinery(formData: FormData) {
  await requireAdmin()
  const supabase = createServerClient()
  
  const name = formData.get('name') as string
  const timezone = formData.get('timezone') as string || 'America/Halifax'
  
  if (!name) {
    throw new Error('Winery name is required')
  }
  
  const { data, error } = await supabase.rpc('admin_create_winery', {
    winery_name: name,
    winery_timezone: timezone
  })
  
  if (error) {
    throw new Error('Failed to create winery')
  }
  
  return data
}

// Rotate winery join code
export async function rotateJoinCode(wineryId: string) {
  await requireAdmin()
  const supabase = createServerClient()
  
  const { data, error } = await supabase.rpc('admin_rotate_join_code', {
    winery_uuid: wineryId
  })
  
  if (error) {
    throw new Error('Failed to rotate join code')
  }
  
  return data
}

// Update support message status
export async function updateSupportStatus(messageId: string, status: 'open' | 'resolved') {
  await requireAdmin()
  const supabase = createServerClient()
  
  const { data, error } = await supabase.rpc('admin_update_support_status', {
    message_id: messageId,
    new_status: status
  })
  
  if (error) {
    throw new Error('Failed to update support message status')
  }
  
  return data
}

// Admin dashboard stats
export async function getAdminStats() {
  await requireAdmin()
  const supabase = createServerClient()
  
  // Get counts for dashboard
  const [
    { count: wineriesCount },
    { count: usersCount },
    { count: batchesCount },
    { count: supportCount }
  ] = await Promise.all([
    supabase.from('wineries').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('batches').select('*', { count: 'exact', head: true }),
    supabase.from('support_messages').select('*', { count: 'exact', head: true })
  ])
  
  return {
    wineries: wineriesCount || 0,
    users: usersCount || 0,
    batches: batchesCount || 0,
    supportMessages: supportCount || 0
  }
} 