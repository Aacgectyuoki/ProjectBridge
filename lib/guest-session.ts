const GUEST_STORAGE_KEY = 'guest_usage_count'
const MAX_GUEST_TRIES = 5

export interface GuestUsage {
  count: number
  lastUsed: string
}

export function getGuestUsageCount(): number {
  if (typeof window === 'undefined') return 0
  
  const usage = localStorage.getItem(GUEST_STORAGE_KEY)
  if (!usage) return 0
  
  const guestUsage: GuestUsage = JSON.parse(usage)
  return guestUsage.count
}

export function incrementGuestUsage(): number {
  if (typeof window === 'undefined') return 0
  
  const currentUsage = getGuestUsageCount()
  const newUsage: GuestUsage = {
    count: currentUsage + 1,
    lastUsed: new Date().toISOString()
  }
  
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newUsage))
  return newUsage.count
}

export function hasRemainingGuestTries(): boolean {
  return getGuestUsageCount() < MAX_GUEST_TRIES
}

export function getRemainingGuestTries(): number {
  return Math.max(0, MAX_GUEST_TRIES - getGuestUsageCount())
}

export function resetGuestUsage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_STORAGE_KEY)
} 