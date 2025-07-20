import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date calculation utilities
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + (weeks * 7))
  return result
}

export function calculateBottleDate(filterDate: Date): Date {
  const bottleDate = addDays(filterDate, 1)
  
  // If bottle date would be Sunday, slide to Monday
  if (bottleDate.getDay() === 0) {
    return addDays(bottleDate, 1)
  }
  
  return bottleDate
}

export function calculateBatchDates(data: {
  dateOfSale: string
  putUpStatus: 'yes' | 'no'
  scheduledPutUpDate?: string
  kitDuration: number
}) {
  const putUp = data.putUpStatus === 'yes' 
    ? new Date() 
    : new Date(data.scheduledPutUpDate || data.dateOfSale)
  
  const rack = addDays(putUp, 14)
  const filter = addWeeks(rack, data.kitDuration - 2)
  const bottle = calculateBottleDate(filter)
  
  return {
    putUp,
    rack,
    filter,
    bottle
  }
}

// Generate secure join code
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateJoinCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code)
}
