import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ success: false, error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 });
  }

  const body = await req.json();
  const { auth_user_id, full_name, email, avatar_url } = body || {};

  if (!auth_user_id || !email) {
    return NextResponse.json({ success: false, error: 'Missing required fields: auth_user_id and email' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const payload: any = {
      auth_user_id,
      email,
      full_name: full_name ?? null,
      avatar_url: avatar_url ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'auth_user_id' })
      .select()
      .limit(1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data?.[0] ?? null });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message ?? 'Unknown error' }, { status: 500 });
  }
}
