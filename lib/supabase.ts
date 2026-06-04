import { createClient } from '@supabase/supabase-js'

// Used in all server-side code (API routes + dashboard pages).
// Service role key bypasses RLS — safe because callers are always server-side.
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
