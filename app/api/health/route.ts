import { NextResponse } from 'next/server';
import { appConfig, hasOpenAIConfig, hasSupabaseFrontEndConfig, hasSupabaseServiceConfig } from '@/lib/config';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    config: {
      supabaseFrontendConfigured: hasSupabaseFrontEndConfig,
      supabaseServiceConfigured: hasSupabaseServiceConfig,
      openAIConfigured: hasOpenAIConfig,
      hasRedirectUrl: Boolean(appConfig.supabaseRedirect),
    },
    timestamp: new Date().toISOString(),
  });
}
