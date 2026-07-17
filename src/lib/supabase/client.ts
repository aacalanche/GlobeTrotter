'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Guard: createBrowserClient uses atob() which fails on the server with base64url JWTs
  if (typeof window === 'undefined') {
    // Return a minimal stub during SSR/prerender — all actual data fetching
    // happens client-side via useEffect, so this is never actually used.
    return { auth: { getUser: async () => ({ data: { user: null } }) } } as any
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
