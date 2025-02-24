import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Regular client for public operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Service client for admin operations (server-side only)
export const getServiceClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseServiceKey) {
    return supabase // Fallback to regular client if no service key
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: Error | null) => {
  if (!error) return;

  // Log the full error object for debugging
  console.error('Supabase error:', {
    message: error.message,
    name: error.name,
    stack: error.stack,
    details: error
  });

  // Throw a more informative error
  throw new Error(`Database operation failed: ${error.message}`);
}
