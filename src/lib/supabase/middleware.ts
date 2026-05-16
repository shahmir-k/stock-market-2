// Edge Supabase session helper — refreshes the auth session cookie on
// every navigation. Called from src/proxy.ts (Next.js 16 proxy convention).

import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { Database } from './database.types';

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    // No Supabase configured — pass through. Auth-gated routes will treat
    // the user as unauthenticated.
    return { response, user: null };
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const c of toSet) {
          request.cookies.set(c.name, c.value);
        }
        response = NextResponse.next({ request });
        for (const c of toSet) {
          response.cookies.set(c.name, c.value, c.options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
