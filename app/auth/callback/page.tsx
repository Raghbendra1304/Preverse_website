'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;
    const supabase = createBrowserSupabaseClient();

    async function syncProfile(user: any) {
      try {
        await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
          }),
        });
      } catch (err) {
        console.error('Profile sync failed', err);
      }
    }

    const doAuthFlow = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!active) return;

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        const user = data?.session?.user;
        if (user) {
          await syncProfile(user);
          router.replace('/dashboard');
          return;
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!active) return;
          if (session?.user) {
            await syncProfile(session.user);
            router.replace('/dashboard');
          }
        });

        unsubscribe = () => {
          authListener?.subscription.unsubscribe();
        };

        const timeout = window.setTimeout(() => {
          if (active) {
            setError('Sign-in session was not established. Please try again.');
          }
          unsubscribe?.();
        }, 8000);

        return () => {
          active = false;
          window.clearTimeout(timeout);
          unsubscribe?.();
        };
      } catch (err: any) {
        if (active) {
          setError(err?.message ?? 'Unable to complete sign-in.');
        }
      }
    };

    void doAuthFlow();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [router]);

  return (
    <div className="container mx-auto py-16">
      {error ? <p className="text-red-600">{error}</p> : <p>Signing you in…</p>}
    </div>
  );
}
