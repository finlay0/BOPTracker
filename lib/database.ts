import { createClient } from './supabase/client'

// Halifax timezone constant
const HALIFAX_TIMEZONE = 'America/Halifax'

// Helper function to get current date in Halifax timezone
export function getHalifaxDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: HALIFAX_TIMEZONE }))
}

// Helper function to format date in Halifax timezone
export function formatDateInHalifax(date: Date): string {
  return date.toLocaleDateString("en-US", { 
    timeZone: HALIFAX_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').reverse().join('-') // Convert MM/DD/YYYY to YYYY-MM-DD
}

// Helper function to get today's date string in Halifax timezone
export function getTodayInHalifax(): string {
  return formatDateInHalifax(getHalifaxDate())
}

export interface Batch {
  id: string
  bop_number: number
  customer_name: string
  customer_email?: string
  kit_name: string
  kit_weeks: number
  date_of_sale: string
  date_put_up: string | null
  date_rack: string | null
  date_filter: string | null
  date_bottle: string | null
  status: 'pending' | 'completed'
  current_stage: 'sale' | 'put-up' | 'rack' | 'filter' | 'bottle' | 'completed'
  notes?: string
  winery_id: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  type: string
  action: string
  bopNumber: string
  wineKit: string
  customer: string
  completed: boolean
  dueDate: string
  batchId: string
  isOverdue: boolean
  completedBy?: string
  completedAt?: string
}

export interface CreateBatchData {
  customer_name: string
  customer_email?: string
  kit_name: string
  kit_weeks: number
  date_of_sale: string
  date_put_up?: string
  put_up_now?: boolean
}

// Calculate wine production dates based on kit duration and business rules
// All dates calculated in Halifax timezone
export function calculateWineDates(
  dateOfSale: string,
  kitWeeks: number,
  putUpDate?: string,
  putUpNow?: boolean
) {
  let putUp: Date
  
  if (putUpNow) {
    putUp = getHalifaxDate()
  } else if (putUpDate) {
    putUp = new Date(putUpDate + 'T12:00:00') // Add time to avoid timezone issues
  } else {
    putUp = new Date(dateOfSale + 'T12:00:00')
  }

  // Racking: 2 weeks after put-up
  const rack = new Date(putUp)
  rack.setDate(rack.getDate() + 14)

  // Filtering: Based on kit duration
  const filter = new Date(rack)
  const filterWeeks = kitWeeks - 2 // 4w=2w, 5w=3w, 6w=4w, 8w=6w
  filter.setDate(filter.getDate() + (filterWeeks * 7))

  // Bottling: 1 day after filtering, never on Sunday
  const bottle = new Date(filter)
  bottle.setDate(bottle.getDate() + 1)
  
  // Move to Monday if it falls on Sunday (using Halifax timezone)
  const bottleDayHalifax = new Date(bottle.toLocaleString("en-US", { timeZone: HALIFAX_TIMEZONE })).getDay()
  if (bottleDayHalifax === 0) {
    bottle.setDate(bottle.getDate() + 1)
  }

  return {
    putUp: formatDateInHalifax(putUp),
    rack: formatDateInHalifax(rack),
    filter: formatDateInHalifax(filter),
    bottle: formatDateInHalifax(bottle)
  }
}

// Get current stage based on dates
export function getCurrentStage(batch: Batch): string {
  const today = new Date().toISOString().split('T')[0]
  
  if (!batch.date_put_up || batch.date_put_up > today) return 'sale'
  if (!batch.date_rack || batch.date_rack > today) return 'put-up'
  if (!batch.date_filter || batch.date_filter > today) return 'rack'
  if (!batch.date_bottle || batch.date_bottle > today) return 'filter'
  return batch.status === 'completed' ? 'completed' : 'bottle'
}

// Create a new batch
export async function createBatch(data: CreateBatchData): Promise<Batch> {
  const supabase = createClient()
  
  // Get user's winery ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  const { data: userProfile } = await supabase
    .from('users')
    .select('winery_id')
    .eq('id', user.id)
    .single()
  
  if (!userProfile?.winery_id) throw new Error('User not associated with a winery')

  // Get next BOP number for this winery
  const { data: bopData, error: bopError } = await supabase
    .rpc('get_next_bop_number', { winery_id: userProfile.winery_id })
  
  if (bopError) throw bopError
  const bopNumber = bopData

  // Calculate dates
  const dates = calculateWineDates(
    data.date_of_sale,
    data.kit_weeks,
    data.date_put_up,
    data.put_up_now
  )

  // Create batch
  const { data: batch, error } = await supabase
    .from('batches')
    .insert({
      winery_id: userProfile.winery_id,
      bop_number: bopNumber,
      customer_name: data.customer_name,
      customer_email: data.customer_email || null,
      kit_name: data.kit_name,
      kit_weeks: data.kit_weeks,
      date_of_sale: data.date_of_sale,
      date_put_up: dates.putUp,
      date_rack: dates.rack,
      date_filter: dates.filter,
      date_bottle: dates.bottle,
      status: 'pending',
      current_stage: 'put-up'
    })
    .select()
    .single()

  if (error) throw error
  return batch
}

// Get all batches for user's winery
export async function getBatches(): Promise<Batch[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('batches')
    .select(`
      *,
      users!inner(winery_id)
    `)
    .eq('users.id', user.id)
    .order('bop_number', { ascending: false })

  if (error) throw error
  return data || []
}

// Get today's tasks using the new RPC function
export async function getTodaysTasks(selectedDate?: Date): Promise<Task[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  const targetDate = selectedDate ? formatDateInHalifax(selectedDate) : getTodayInHalifax()

  const { data: tasksData, error } = await supabase
    .rpc('get_tasks_for_date', { target_date: targetDate })

  if (error) throw error
  if (!tasksData) return []

  // Convert RPC results to Task interface
  return tasksData.map(task => ({
    id: task.task_id,
    type: task.category,
    action: task.action_name,
    bopNumber: `#${task.bop_number.toString().padStart(4, '0')}`,
    wineKit: task.kit_name,
    customer: task.customer_name,
    completed: task.is_completed,
    dueDate: task.due_date,
    batchId: task.batch_id.toString(),
    isOverdue: task.is_overdue,
    completedBy: task.completed_by,
    completedAt: task.completed_at
  }))
}


// Update task completion status using RPC functions
export async function updateTaskCompletion(taskId: string, completed: boolean, dueDate?: string): Promise<void> {
  const supabase = createClient()
  
  // Parse taskId to get batch_id and task_type
  // Format: "batch_id-task_type" (e.g., "1-rack")
  const [batchIdStr, taskType] = taskId.split('-')
  const batchId = parseInt(batchIdStr)
  
  if (!batchId || !taskType) {
    throw new Error('Invalid task ID format')
  }

  if (completed) {
    // Use the actual due date if provided, otherwise use today
    const taskDueDate = dueDate || getTodayInHalifax()
    
    // Complete the task
    const { data, error } = await supabase
      .rpc('complete_task', {
        batch_id_param: batchId,
        task_type_param: taskType,
        due_date_param: taskDueDate
      })
    
    if (error) throw error
  } else {
    // Undo the task completion
    const { data, error } = await supabase
      .rpc('undo_task_completion', {
        batch_id_param: batchId,
        task_type_param: taskType
      })
    
    if (error) throw error
  }
}

// Get a single batch by ID
export async function getBatch(id: string): Promise<Batch | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('batches')
    .select(`
      *,
      users!inner(winery_id)
    `)
    .eq('id', id)
    .eq('users.id', user.id)
    .single()

  if (error) throw error
  return data
}

// Update batch notes
export async function updateBatchNotes(batchId: string, notes: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  // Verify user has access to this batch
  const { data: userProfile } = await supabase
    .from('users')
    .select('winery_id')
    .eq('id', user.id)
    .single()
  
  if (!userProfile?.winery_id) throw new Error('User not associated with a winery')

  const { error } = await supabase
    .from('batches')
    .update({ 
      notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', batchId)
    .eq('winery_id', userProfile.winery_id)

  if (error) throw error
}

// Settings-related functions

export interface UserSettingsProfile {
  user_id: string
  email: string
  full_name: string
  role: string
  winery_id: number
  winery_name: string
  winery_join_code: string
  created_at: string
  updated_at: string
}

// Get user settings profile
export async function getUserSettingsProfile(): Promise<UserSettingsProfile> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_user_settings_profile')
    .single()

  if (error) throw error
  return data
}

// Update user email
export async function updateUserEmail(newEmail: string): Promise<void> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('update_user_email', { new_email_param: newEmail })

  if (error) throw error
}

// Submit support message
export async function submitSupportMessage(subject: string, message: string): Promise<string> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('submit_support_message', { 
      subject_param: subject, 
      message_param: message 
    })

  if (error) throw error
  return data
} 