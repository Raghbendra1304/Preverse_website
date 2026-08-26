import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { appConfig } from './config';

export function createBrowserSupabaseClient(): SupabaseClient {
  if (!appConfig.supabaseUrl || !appConfig.supabaseAnonKey) {
    console.warn('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before using auth features.');
    return createClient('https://placeholder.supabase.co', 'placeholder-anon-key');
  }

  return createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
}
