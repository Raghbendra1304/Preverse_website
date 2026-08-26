import { NextResponse } from 'next/server';
import { appConfig, hasGeminiConfig, hasSupabaseFrontEndConfig, hasSupabaseServiceConfig } from '@/lib/config';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    config: {
      supabaseFrontendConfigured: hasSupabaseFrontEndConfig,
      supabaseServiceConfigured: hasSupabaseServiceConfig,
      geminiConfigured: hasGeminiConfig,
      hasRedirectUrl: Boolean(appConfig.supabaseRedirect),
    },
    timestamp: new Date().toISOString(),
  });
}
