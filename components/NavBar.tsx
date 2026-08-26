'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';
import ThemeToggle from './ThemeToggle';

export default function NavBar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createBrowserSupabaseClient();

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setUserEmail(data?.session?.user?.email ?? null);
      }
    }

    loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setUserEmail(null);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/90">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/" className="text-lg font-semibold text-slate-950 dark:text-white">
          PrepVerse
        </Link>
        <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
          <ThemeToggle />
          <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Link href="/dashboard" className="transition hover:text-slate-900 dark:hover:text-white">
              Dashboard
            </Link>
            <Link href="/practice" className="transition hover:text-slate-900 dark:hover:text-white">
              Practice
            </Link>
            <Link href="/interview" className="transition hover:text-slate-900 dark:hover:text-white">
              Interview
            </Link>
            {userEmail ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full bg-violet-600 px-4 py-2 text-white transition hover:bg-violet-500"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/signin"
                className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
