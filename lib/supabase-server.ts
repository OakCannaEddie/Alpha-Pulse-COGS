/**
 * Supabase Server Client
 * 
 * Creates a Supabase client with the service role key for server-side operations.
 * This bypasses Row Level Security (RLS) and should only be used in API routes.
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

/**
 * Creates a Supabase admin client with service role privileges
 * 
 * @throws Error if required environment variables are missing
 * @returns SupabaseClient with admin access
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Validate environment variables
  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file.'
    )
  }

  if (!supabaseServiceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Please add it to your .env.local file. ' +
      'You can find this key in your Supabase project settings under API > service_role key.'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Creates a standard Supabase client with anon key for client-side operations
 * 
 * @throws Error if required environment variables are missing
 * @returns SupabaseClient with anon access
 */
export function createAnonSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate environment variables
  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file.'
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please add it to your .env.local file. ' +
      'You can find this key in your Supabase project settings under API > anon/public key.'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}
