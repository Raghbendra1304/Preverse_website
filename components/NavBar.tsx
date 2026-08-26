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
    <header className="sticky top-0 z-50 border-b border-[#202b2a]/10 bg-[#f4f1ea]/90 backdrop-blur dark:border-[#edf2e9]/10 dark:bg-[#182321]/90">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#202b2a] dark:text-[#edf2e9]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#de754d] text-sm text-white">P</span>
          PrepVerse
        </Link>
        <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
          <ThemeToggle />
          <nav className="flex flex-wrap items-center gap-3 text-sm text-[#5c6965] dark:text-[#afbeb4]">
            <Link href="/dashboard" className="transition hover:text-[#202b2a] dark:hover:text-white">
              Dashboard
            </Link>
            <Link href="/practice" className="transition hover:text-[#202b2a] dark:hover:text-white">
              Practice
            </Link>
            <Link href="/interview" className="transition hover:text-[#202b2a] dark:hover:text-white">
              Interview
            </Link>
            {userEmail ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg bg-[#202b2a] px-4 py-2 text-white transition hover:bg-[#354642]"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/signin"
                className="rounded-lg bg-[#202b2a] px-4 py-2 text-white transition hover:bg-[#354642] dark:bg-[#edf2e9] dark:text-[#182321] dark:hover:bg-white"
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
