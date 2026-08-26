export const appConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseRedirect: process.env.NEXT_PUBLIC_SUPABASE_REDIRECT ?? 'http://localhost:3000/auth/callback',
  openAIApiKey: process.env.OPENAI_API_KEY ?? '',
};

export const hasSupabaseFrontEndConfig = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
export const hasSupabaseServiceConfig = Boolean(appConfig.supabaseServiceRoleKey);
export const hasOpenAIConfig = Boolean(appConfig.openAIApiKey);
