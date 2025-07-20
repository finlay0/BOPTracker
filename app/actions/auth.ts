'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Join a winery using a 6-digit code
export async function joinWinery(joinCode: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('You must be logged in to join a winery')
  }

  // Check if user is already associated with a winery
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('winery_id, role')
    .eq('id', user.id)
    .single()

  if (userError) {
    throw new Error('Failed to check user status')
  }

  if (existingUser.winery_id) {
    throw new Error('You are already associated with a winery')
  }

  // Find winery by join code
  const { data: winery, error: wineryError } = await supabase
    .from('wineries')
    .select('id, name')
    .eq('join_code', joinCode.toUpperCase())
    .single()

  if (wineryError || !winery) {
    throw new Error('Invalid join code. Please check the code and try again.')
  }

  // Associate user with winery
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      winery_id: winery.id,
      role: 'staff' // Default role for joined users
    })
    .eq('id', user.id)

  if (updateError) {
    throw new Error('Failed to join winery. Please try again.')
  }

  return {
    success: true,
    winery: {
      id: winery.id,
      name: winery.name
    }
  }
}

// Create a new winery (for owners)
export async function createWinery(wineryName: string, timezone: string = 'America/Halifax') {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('You must be logged in to create a winery')
  }

  // Check if user is already associated with a winery
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('winery_id')
    .eq('id', user.id)
    .single()

  if (userError) {
    throw new Error('Failed to check user status')
  }

  if (existingUser.winery_id) {
    throw new Error('You are already associated with a winery')
  }

  // Create new winery
  const { data: newWinery, error: wineryError } = await supabase
    .from('wineries')
    .insert({
      name: wineryName.trim(),
      timezone: timezone
    })
    .select('id, name, join_code')
    .single()

  if (wineryError) {
    throw new Error('Failed to create winery. Please try again.')
  }

  // Associate user as owner
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      winery_id: newWinery.id,
      role: 'owner'
    })
    .eq('id', user.id)

  if (updateError) {
    // If user update fails, clean up the created winery
    await supabase
      .from('wineries')
      .delete()
      .eq('id', newWinery.id)
    
    throw new Error('Failed to create winery. Please try again.')
  }

  return {
    success: true,
    winery: {
      id: newWinery.id,
      name: newWinery.name,
      joinCode: newWinery.join_code
    }
  }
}

// Get current user's winery information
export async function getUserWinery() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return null
  }

  // Get user with winery info
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select(`
      id,
      role,
      winery_id,
      wineries (
        id,
        name,
        join_code,
        timezone
      )
    `)
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return null
  }

  return {
    user: {
      id: userData.id,
      email: user.email,
      role: userData.role
    },
    winery: userData.wineries ? {
      id: userData.wineries.id,
      name: userData.wineries.name,
      joinCode: userData.wineries.join_code,
      timezone: userData.wineries.timezone
    } : null
  }
} 