import { createClient } from "@supabase/supabase-js"
import type { User, UserPreferences } from "../types/database-schema"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.error("Error getting current user:", error)
    return null
  }

  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata.full_name,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login: user.last_sign_in_at,
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase.from("user_preferences").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error getting user preferences:", error)
    return null
  }

  return data as UserPreferences
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .update({
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating user preferences:", error)
    return null
  }

  return data as UserPreferences
}
