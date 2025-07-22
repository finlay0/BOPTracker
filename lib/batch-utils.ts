import { supabaseServer } from './supabase'
import { calculateBatchDates } from './utils'

// Halifax timezone helper
function getHalifaxDate() {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Halifax"}))
}

function toHalifaxDateString(date: Date) {
  return new Date(date.toLocaleString("en-US", {timeZone: "America/Halifax"}))
    .toISOString().split('T')[0]
}

// Create a new batch (BOP number and dates calculated automatically by triggers)
export async function createBatch(batchData: {
  winery_id: string
  customer: string
  customer_email?: string | null
  wine_kit: string
  kit_weeks: 4 | 5 | 6 | 8
  date_of_sale: string
  put_up_date: string
  status?: 'pending' | 'done'
  current_stage?: 'put_up' | 'rack' | 'filter' | 'bottle'
  notes?: string | null
  created_by: string
}) {
  const supabase = supabaseServer()
  
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

// Get batches for a specific date (for Today page) - includes overdue
export async function getBatchesForDate(wineryId: string, date: Date) {
  const supabase = supabaseServer()
  const halifaxDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Halifax"}))
  const dateStr = halifaxDate.toISOString().split('T')[0]
  const todayStr = getHalifaxDate().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('winery_id', wineryId)
    .eq('status', 'pending')
    .or(`put_up_date.eq.${dateStr},rack_date.eq.${dateStr},filter_date.eq.${dateStr},bottle_date.eq.${dateStr},put_up_date.lt.${todayStr},rack_date.lt.${todayStr},filter_date.lt.${todayStr},bottle_date.lt.${todayStr}`)
  
  if (error) {
    console.error('Error getting batches for date:', error)
    throw new Error('Failed to get batches for date')
  }
  
  return data || []
}

// Get overdue batches (computed on-the-fly)
export async function getOverdueBatches(wineryId: string) {
  const supabase = supabaseServer()
  const todayStr = getHalifaxDate().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('winery_id', wineryId)
    .eq('status', 'pending')
    .or(`put_up_date.lt.${todayStr},rack_date.lt.${todayStr},filter_date.lt.${todayStr},bottle_date.lt.${todayStr}`)
  
  if (error) {
    console.error('Error getting overdue batches:', error)
    throw new Error('Failed to get overdue batches')
  }
  
  return data || []
}

// Get all batches for a winery (for All Batches page)
export async function getAllBatches(wineryId: string) {
  const supabase = supabaseServer()
  
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

// Update batch status (e.g., mark as done) - now supports individual stage completion
export async function updateBatchStageStatus(batchId: string, stage: 'put_up' | 'rack' | 'filter' | 'bottle', completed: boolean) {
  const supabase = supabaseServer()
  
  // Get current batch to check stages
  const { data: batch, error: fetchError } = await supabase
    .from('batches')
    .select('*')
    .eq('id', batchId)
    .single()
  
  if (fetchError || !batch) {
    console.error('Error fetching batch:', fetchError)
    throw new Error('Failed to fetch batch for update')
  }
  
  // Update the specific stage completion
  const updateData: any = {}
  updateData[`${stage}_completed`] = completed
  
  // If all stages are completed, mark batch as done
  const allStagesCompleted = 
    (stage === 'put_up' ? completed : batch.put_up_completed) &&
    (stage === 'rack' ? completed : batch.rack_completed) &&
    (stage === 'filter' ? completed : batch.filter_completed) &&
    (stage === 'bottle' ? completed : batch.bottle_completed)
  
  if (allStagesCompleted) {
    updateData.status = 'done'
  } else if (batch.status === 'done' && !completed) {
    // If unmarking a stage and batch was done, set back to pending
    updateData.status = 'pending'
  }
  
  const { data, error } = await supabase
    .from('batches')
    .update(updateData)
    .eq('id', batchId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating batch stage:', error)
    throw new Error('Failed to update batch stage')
  }
  
  return data
}

// Legacy function for backward compatibility
export async function updateBatchStatus(batchId: string, status: 'pending' | 'done') {
  const supabase = supabaseServer()
  
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

// Generate tasks from batches for a specific date with proper ordering
export function generateTasksFromBatches(batches: any[], date: Date) {
  const halifaxDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Halifax"}))
  const dateStr = halifaxDate.toISOString().split('T')[0]
  const todayStr = getHalifaxDate().toISOString().split('T')[0]
  const tasks: any[] = []
  
  batches.forEach(batch => {
    const isOverdue = (taskDate: string) => taskDate < todayStr
    
    // Check each stage and add tasks in proper order
    // 1. Put-up tasks
    if (batch.put_up_date === dateStr || isOverdue(batch.put_up_date)) {
      const taskType = isOverdue(batch.put_up_date) ? 'Overdue' : 'Put-Up Today'
      tasks.push({
        id: `${batch.id}-putup`,
        type: taskType,
        action: 'Start',
        bopNumber: `#${batch.bop_number}`,
        wineKit: batch.wine_kit,
        customer: batch.customer,
        completed: batch.put_up_completed || false,
        batchId: batch.id,
        stage: 'put_up',
        dueDate: batch.put_up_date,
        priority: isOverdue(batch.put_up_date) ? 0 : 1
      })
    }
    
    // 2. Rack tasks
    if (batch.rack_date === dateStr || isOverdue(batch.rack_date)) {
      const taskType = isOverdue(batch.rack_date) ? 'Overdue' : 'Rack Today'
      tasks.push({
        id: `${batch.id}-rack`,
        type: taskType,
        action: 'Rack',
        bopNumber: `#${batch.bop_number}`,
        wineKit: batch.wine_kit,
        customer: batch.customer,
        completed: batch.rack_completed || false,
        batchId: batch.id,
        stage: 'rack',
        dueDate: batch.rack_date,
        priority: isOverdue(batch.rack_date) ? 0 : 2
      })
    }
    
    // 3. Filter tasks
    if (batch.filter_date === dateStr || isOverdue(batch.filter_date)) {
      const taskType = isOverdue(batch.filter_date) ? 'Overdue' : 'Filter Today'
      tasks.push({
        id: `${batch.id}-filter`,
        type: taskType,
        action: 'Filter',
        bopNumber: `#${batch.bop_number}`,
        wineKit: batch.wine_kit,
        customer: batch.customer,
        completed: batch.filter_completed || false,
        batchId: batch.id,
        stage: 'filter',
        dueDate: batch.filter_date,
        priority: isOverdue(batch.filter_date) ? 0 : 3
      })
    }
    
    // 4. Bottle tasks
    if (batch.bottle_date === dateStr || isOverdue(batch.bottle_date)) {
      const taskType = isOverdue(batch.bottle_date) ? 'Overdue' : 'Bottle Today'
      tasks.push({
        id: `${batch.id}-bottle`,
        type: taskType,
        action: 'Bottle',
        bopNumber: `#${batch.bop_number}`,
        wineKit: batch.wine_kit,
        customer: batch.customer,
        completed: batch.bottle_completed || false,
        batchId: batch.id,
        stage: 'bottle',
        dueDate: batch.bottle_date,
        priority: isOverdue(batch.bottle_date) ? 0 : 4
      })
    }
  })
  
  // Sort tasks: overdue first (priority 0), then by stage order (put-up=1, rack=2, filter=3, bottle=4)
  return tasks.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    // Within same priority, sort by BOP number
    return a.bopNumber.localeCompare(b.bopNumber)
  })
}

// Export Halifax date helpers
export { getHalifaxDate, toHalifaxDateString }

// User profile management functions
export async function updateUserDarkMode(userId: string, darkMode: boolean) {
  const supabase = supabaseServer()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ dark_mode: darkMode })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating dark mode:', error)
    throw new Error('Failed to update dark mode setting')
  }
  
  return data
}

export async function getUserProfile(userId: string) {
  const supabase = supabaseServer()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error getting user profile:', error)
    throw new Error('Failed to get user profile')
  }
  
  return data
} 
