import { createServerClient } from './supabase'
import { calculateBatchDates } from './utils'

// Create a new batch (BOP number and dates calculated automatically by triggers)
export async function createBatch(batchData: {
  winery_id: string
  customer: string
  wine_kit: string
  kit_weeks: 4 | 5 | 6 | 8
  date_of_sale: string
  put_up_date: string
  status?: 'pending' | 'done'
  current_stage?: string
  notes?: string | null
}) {
  const supabase = createServerClient()
  
  // The trigger will automatically:
  // - Assign bop_number via get_next_bop_number()
  // - Calculate rack_date, filter_date, bottle_date
  const { data, error } = await supabase
    .from('batches')
    .insert(batchData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating batch:', error)
    throw new Error('Failed to create batch')
  }
  
  return data
}

// Get batches for a specific date (for Today page)
export async function getBatchesForDate(wineryId: string, date: Date) {
  const supabase = createServerClient()
  const dateStr = date.toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('winery_id', wineryId)
    .or(`put_up_date.eq.${dateStr},rack_date.eq.${dateStr},filter_date.eq.${dateStr},bottle_date.eq.${dateStr}`)
    .eq('status', 'pending')
  
  if (error) {
    console.error('Error getting batches for date:', error)
    throw new Error('Failed to get batches for date')
  }
  
  return data || []
}

// Get overdue batches (computed on-the-fly)
export async function getOverdueBatches(wineryId: string) {
  const supabase = createServerClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('winery_id', wineryId)
    .eq('status', 'pending')
    .or(`put_up_date.lt.${today},rack_date.lt.${today},filter_date.lt.${today},bottle_date.lt.${today}`)
  
  if (error) {
    console.error('Error getting overdue batches:', error)
    throw new Error('Failed to get overdue batches')
  }
  
  return data || []
}

// Get all batches for a winery (for All Batches page)
export async function getAllBatches(wineryId: string) {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('winery_id', wineryId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error getting all batches:', error)
    throw new Error('Failed to get all batches')
  }
  
  return data || []
}

// Update batch status (e.g., mark as done)
export async function updateBatchStatus(batchId: string, status: 'pending' | 'done') {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('batches')
    .update({ status })
    .eq('id', batchId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating batch status:', error)
    throw new Error('Failed to update batch status')
  }
  
  return data
}

// Generate tasks from batches for a specific date
export function generateTasksFromBatches(batches: any[], date: Date) {
  const dateStr = date.toISOString().split('T')[0]
  const tasks: any[] = []
  
  batches.forEach(batch => {
    // Check which stage is due on this date
    if (batch.put_up_date === dateStr) {
      tasks.push({
        id: `${batch.id}-putup`,
        type: 'Put-Up Today',
        action: 'Start',
        bopNumber: `#${batch.bop_number}`,
        wineKit: batch.wine_kit,
        customer: batch.customer,
        completed: batch.status === 'done',
        batchId: batch.id
      })
    }
    
    if (batch.rack_date === dateStr) {
      tasks.push({
        id: `${batch.id}-rack`,
        type: 'Rack Today',
        action: 'Rack',
        bopNumber: `#${batch.bop_number}`,
        wineKit: batch.wine_kit,
        customer: batch.customer,
        completed: batch.status === 'done',
        batchId: batch.id
      })
    }
    
    if (batch.filter_date === dateStr) {
      tasks.push({
        id: `${batch.id}-filter`,
        type: 'Filter Today',
        action: 'Filter',
        bopNumber: `#${batch.bop_number}`,
        wineKit: batch.wine_kit,
        customer: batch.customer,
        completed: batch.status === 'done',
        batchId: batch.id
      })
    }
    
    if (batch.bottle_date === dateStr) {
      tasks.push({
        id: `${batch.id}-bottle`,
        type: 'Bottle Today',
        action: 'Bottle',
        bopNumber: `#${batch.bop_number}`,
        wineKit: batch.wine_kit,
        customer: batch.customer,
        completed: batch.status === 'done',
        batchId: batch.id
      })
    }
  })
  
  return tasks
} 