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

// Create a new batch
export async function createBatch(formData: {
  customerName: string
  customerEmail?: string
  wineKitName: string
  kitDuration: string
  dateOfSale: string
  putUpStatus: string
  scheduledPutUpDate?: string
}) {
  const { user, winery_id } = await getAuthenticatedUserWinery()
  const supabase = createServerClient()
  
  // Validate required fields
  if (!formData.customerName.trim()) {
    throw new Error('Customer name is required')
  }
  
  if (!formData.wineKitName.trim()) {
    throw new Error('Wine kit name is required')
  }
  
  if (!formData.dateOfSale) {
    throw new Error('Date of sale is required')
  }
  
  // Determine put-up date
  let putUpDate: string
  if (formData.putUpStatus === 'yes') {
    // Already put up - use today's date
    putUpDate = new Date().toISOString().split('T')[0]
  } else {
    // Not put up yet - use scheduled date
    if (!formData.scheduledPutUpDate) {
      throw new Error('Scheduled put-up date is required')
    }
    putUpDate = formData.scheduledPutUpDate
  }
  
  // Parse kit duration
  const kitWeeks = parseInt(formData.kitDuration) as 4 | 5 | 6 | 8
  if (![4, 5, 6, 8].includes(kitWeeks)) {
    throw new Error('Invalid kit duration')
  }
  
  // Insert batch - triggers will handle BOP number and date calculations
  const { data, error } = await supabase
    .from('batches')
    .insert({
      winery_id,
      customer: formData.customerName.trim(),
      wine_kit: formData.wineKitName.trim(),
      kit_weeks: kitWeeks,
      date_of_sale: formData.dateOfSale,
      put_up_date: putUpDate,
      status: 'pending',
      current_stage: 'put-up',
      notes: formData.customerEmail ? `Customer email: ${formData.customerEmail}` : null
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating batch:', error)
    throw new Error('Failed to create batch. Please try again.')
  }
  
  return data
}

// Get all batches for the user's winery
export async function getWineryBatches(searchTerm?: string, filters?: {
  weekFilter?: string
  statusFilter?: string
  sortBy?: string
}) {
  const { winery_id } = await getAuthenticatedUserWinery()
  const supabase = createServerClient()
  
  let query = supabase
    .from('batches')
    .select('*')
    .eq('winery_id', winery_id)
  
  // Apply search filter
  if (searchTerm) {
    query = query.or(`customer.ilike.%${searchTerm}%,wine_kit.ilike.%${searchTerm}%,bop_number::text.ilike.%${searchTerm}%`)
  }
  
  // Apply week filter
  if (filters?.weekFilter && filters.weekFilter !== 'all') {
    query = query.eq('kit_weeks', parseInt(filters.weekFilter))
  }
  
  // Apply status filter
  if (filters?.statusFilter && filters.statusFilter !== 'all') {
    if (filters.statusFilter === 'in-progress') {
      query = query.eq('status', 'pending')
    } else if (filters.statusFilter === 'completed') {
      query = query.eq('status', 'done')
    } else if (filters.statusFilter === 'overdue') {
      // Get overdue batches (any stage date in the past for pending batches)
      const today = new Date().toISOString().split('T')[0]
      query = query
        .eq('status', 'pending')
        .or(`put_up_date.lt.${today},rack_date.lt.${today},filter_date.lt.${today},bottle_date.lt.${today}`)
    }
  }
  
  // Apply sorting
  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case 'bottling-soonest':
        query = query.order('bottle_date', { ascending: true })
        break
      case 'customer-az':
        query = query.order('customer', { ascending: true })
        break
      case 'bop-newest':
        query = query.order('bop_number', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }
  } else {
    query = query.order('created_at', { ascending: false })
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching batches:', error)
    throw new Error('Failed to fetch batches')
  }
  
  return data || []
}

// Get a single batch by ID
export async function getBatch(batchId: string) {
  const { winery_id } = await getAuthenticatedUserWinery()
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('id', batchId)
    .eq('winery_id', winery_id) // Ensure user can only access their winery's batches
    .single()
  
  if (error) {
    console.error('Error fetching batch:', error)
    throw new Error('Batch not found')
  }
  
  return data
}

// Validate date sequence (prevent impossible orders)
function validateDateSequence(updates: any, existingBatch?: any) {
  const dates = {
    put_up_date: updates.put_up_date || existingBatch?.put_up_date,
    rack_date: updates.rack_date || existingBatch?.rack_date,
    filter_date: updates.filter_date || existingBatch?.filter_date,
    bottle_date: updates.bottle_date || existingBatch?.bottle_date
  }

  // Convert to Date objects for comparison
  const putUp = dates.put_up_date ? new Date(dates.put_up_date) : null
  const rack = dates.rack_date ? new Date(dates.rack_date) : null
  const filter = dates.filter_date ? new Date(dates.filter_date) : null
  const bottle = dates.bottle_date ? new Date(dates.bottle_date) : null

  // Check sequence: Put-Up < Rack < Filter < Bottle
  if (putUp && rack && putUp >= rack) {
    throw new Error('Racking date must be after Put-Up date')
  }
  if (rack && filter && rack >= filter) {
    throw new Error('Filtering date must be after Racking date')
  }
  if (filter && bottle && filter >= bottle) {
    throw new Error('Bottling date must be after Filtering date')
  }
  if (putUp && filter && putUp >= filter) {
    throw new Error('Filtering date must be after Put-Up date')
  }
  if (putUp && bottle && putUp >= bottle) {
    throw new Error('Bottling date must be after Put-Up date')
  }
  if (rack && bottle && rack >= bottle) {
    throw new Error('Bottling date must be after Racking date')
  }
}

// Update batch details
export async function updateBatch(batchId: string, updates: {
  customer?: string
  wine_kit?: string
  kit_weeks?: 4 | 5 | 6 | 8
  date_of_sale?: string
  put_up_date?: string
  rack_date?: string
  filter_date?: string
  bottle_date?: string
  notes?: string
  status?: 'pending' | 'done'
  current_stage?: 'put-up' | 'racked' | 'filtered' | 'bottled' | 'completed'
}) {
  const { winery_id } = await getAuthenticatedUserWinery()
  const supabase = createServerClient()
  
  // Get existing batch for date validation
  const { data: existingBatch } = await supabase
    .from('batches')
    .select('put_up_date, rack_date, filter_date, bottle_date')
    .eq('id', batchId)
    .eq('winery_id', winery_id)
    .single()

  // Validate date sequence if dates are being updated
  if (updates.put_up_date || updates.rack_date || updates.filter_date || updates.bottle_date) {
    validateDateSequence(updates, existingBatch)
  }

  // Ensure user can only update their winery's batches
  const { data, error } = await supabase
    .from('batches')
    .update(updates)
    .eq('id', batchId)
    .eq('winery_id', winery_id)
    .select()
    .single()

  if (error) {
    console.error('Error updating batch:', error)
    throw new Error('Failed to update batch')
  }

  return data
}

// Mark batch as complete (all stages done)
export async function markBatchComplete(batchId: string) {
  const { winery_id } = await getAuthenticatedUserWinery()
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('batches')
    .update({ 
      status: 'done',
      current_stage: 'completed'
    })
    .eq('id', batchId)
    .eq('winery_id', winery_id)
    .select()
    .single()
  
  if (error) {
    console.error('Error marking batch complete:', error)
    throw new Error('Failed to mark batch as complete')
  }
  
  return data
}

// Mark a specific stage as complete and advance batch progress
export async function markStageComplete(batchId: string, stage: 'put-up' | 'rack' | 'filter' | 'bottle') {
  const { winery_id } = await getAuthenticatedUserWinery()
  const supabase = createServerClient()
  
  // Define stage progression
  const stageProgression = {
    'put-up': 'racked',
    'rack': 'filtered', 
    'filter': 'bottled',
    'bottle': 'completed'
  }
  
  const nextStage = stageProgression[stage]
  const isComplete = nextStage === 'completed'
  
  // Update batch to next stage
  const { data, error } = await supabase
    .from('batches')
    .update({ 
      current_stage: nextStage,
      status: isComplete ? 'done' : 'pending'
    })
    .eq('id', batchId)
    .eq('winery_id', winery_id)
    .select()
    .single()

  if (error) {
    console.error('Error marking stage complete:', error)
    throw new Error(`Failed to mark ${stage} stage complete`)
  }

  return data
}

// Get batches for a specific date (for Today tab)
export async function getBatchesForDate(date: Date) {
  const { winery_id } = await getAuthenticatedUserWinery()
  const supabase = createServerClient()
  
  const dateStr = date.toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('winery_id', winery_id)
    .eq('status', 'pending')
    .or(`put_up_date.eq.${dateStr},rack_date.eq.${dateStr},filter_date.eq.${dateStr},bottle_date.eq.${dateStr}`)
  
  if (error) {
    console.error('Error fetching batches for date:', error)
    throw new Error('Failed to fetch tasks for date')
  }
  
  return data || []
}

// Get overdue batches
export async function getOverdueBatches() {
  const { winery_id } = await getAuthenticatedUserWinery()
  const supabase = createServerClient()
  
  // Get yesterday's date (tasks become overdue at 12:00 AM the next day)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('winery_id', winery_id)
    .eq('status', 'pending')
    .or(`put_up_date.lte.${yesterdayStr},rack_date.lte.${yesterdayStr},filter_date.lte.${yesterdayStr},bottle_date.lte.${yesterdayStr}`)
  
  if (error) {
    console.error('Error fetching overdue batches:', error)
    throw new Error('Failed to fetch overdue tasks')
  }
  
  return data || []
} 