'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Helper to get authenticated user and their winery
async function getAuthenticatedUserWinery() {
  const supabase = createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get user's winery info
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('winery_id, role')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.winery_id) {
    throw new Error('User not associated with a winery')
  }

  return {
    user,
    winery_id: userData.winery_id,
    role: userData.role
  }
}

// Send a support message
export async function sendSupportMessage(formData: {
  subject?: string
  message: string
}) {
  const { user, winery_id } = await getAuthenticatedUserWinery()
  const supabase = createServerClient()
  
  // Validate required fields
  if (!formData.message.trim()) {
    throw new Error('Message is required')
  }
  
  // Insert support message
  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      winery_id,
      user_id: user.id,
      subject: formData.subject?.trim() || 'Support Request',
      message: formData.message.trim(),
      status: 'open'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating support message:', error)
    throw new Error('Failed to send support message. Please try again.')
  }
  
  return data
} 