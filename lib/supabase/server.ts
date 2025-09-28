import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseAdminClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

// Backwards-compatible export so existing imports continue working
export function createClient() {
  return createAdminClient()
}
