// Handles email confirmation + magic link callbacks. Supabase appends `code`
// to the redirect URL; we exchange it for a session cookie and redirect.

import { NextResponse, type NextRequest } from 'next/server';

import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const redirectTo = url.searchParams.get('redirect') ?? '/dashboard';

  if (code) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const target = url.clone();
  target.pathname = redirectTo;
  target.search = '';
  return NextResponse.redirect(target);
}
