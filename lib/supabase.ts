import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserSession = {
  user: {
    id: string
    email?: string | null
  } | null
  error: Error | null
}

export async function getCurrentUser(): Promise<UserSession> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    
    if (!user) return { user: null, error: null }
    
    return { 
      user: {
        id: user.id,
        email: user.email
      }, 
      error: null 
    }
  } catch (error) {
    return { user: null, error: error as Error }
  }
} 