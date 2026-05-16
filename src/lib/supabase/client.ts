// Browser-side Supabase client. Uses publishable key (RLS enforces access).
// Imported by client components only.

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './database.types';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set.',
    );
  }
  client = createBrowserClient<Database>(url, key);
  return client;
}
