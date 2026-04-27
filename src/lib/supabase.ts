import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getPublicEnv, getServerEnv } from '@/lib/env'

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

/** Cliente público (browser) — lazy singleton */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      getPublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    )
  }
  return _supabase
}

/** Cliente admin (server-side únicamente) — lazy singleton */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      getPublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getServerEnv('SUPABASE_SERVICE_ROLE_KEY')
    )
  }
  return _supabaseAdmin
}

/** Alias conveniente para SSR — siempre usar getSupabase() en componentes cliente */
export const supabase = { get: getSupabase }
export const supabaseAdmin = { get: getSupabaseAdmin }
