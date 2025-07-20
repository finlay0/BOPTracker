export interface Task {
  id: number
  type: 'Bottle Today' | 'Filter Today' | 'Rack Today' | 'Put-Up Today' | 'Overdue'
  action: string
  bopNumber: string
  wineKit: string
  customer: string
  completed: boolean
  batchId?: string
  stage?: 'put-up' | 'rack' | 'filter' | 'bottle'
} 