'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePhoneOtp = async () => {
    setLoading(true);
    setMessage(null);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false } });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setPhoneOtpSent(true);
      setMessage('OTP sent to your mobile number.');
    }
  };

  const verifyPhoneOtp = async () => {
    setLoading(true);
    setMessage(null);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (user) {
          // Sync profile server-side
          await fetch('/api/auth/sync-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              auth_user_id: user.id,
              email: user.email,
              full_name: (user.user_metadata as any)?.full_name ?? (user.user_metadata as any)?.name ?? null,
              avatar_url: (user.user_metadata as any)?.avatar_url ?? null,
            }),
          });
        }
      } catch (err) {
        // Non-blocking — profile sync failure should not prevent navigation
        console.error('Profile sync failed', err);
      }

      router.push('/dashboard');
    }
  };
  const handleGoogleSignIn = async () => {
    const supabase = createBrowserSupabaseClient();
    try {
      // Use an explicit callback path that handles the OAuth response
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
    } catch (err) {
      console.error('Google sign-in failed', err);
      setMessage('Google sign-in failed.');
    }
  };

  return (
    <section className="container mx-auto py-16">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200/80 bg-white/90 p-10 shadow-glow dark:border-slate-700/80 dark:bg-slate-950/90">
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Sign in to PrepVerse</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Enter your email and password to continue your study plan.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          {message ? <p className="text-sm text-red-600 dark:text-red-400">{message}</p> : null}

          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              Sign in with Google
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Sign in with mobile</h2>
          <div className="mt-4 flex gap-3">
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 9876543210"
              className="min-w-0 flex-1 rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button type="button" onClick={handlePhoneOtp} disabled={loading || !phone} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900">
              Send OTP
            </button>
          </div>
          {phoneOtpSent ? (
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter OTP"
                className="min-w-0 flex-1 rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button type="button" onClick={verifyPhoneOtp} disabled={loading || !otp} className="rounded-3xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                Verify
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
