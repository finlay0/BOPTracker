import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });   // auto-wires cookies

  const { email, password } = await req.json();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
} 