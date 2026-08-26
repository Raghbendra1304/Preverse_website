'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';

export default function SignUpPage() {
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
    const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true } });
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else if (data?.user) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (user) {
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
        console.error('Profile sync failed', err);
      }
      router.push('/dashboard');
    } else {
      setMessage('Please check your email for confirmation before signing in.');
    }
  };

  return (
    <section className="container mx-auto py-16">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200/80 bg-white/90 p-10 shadow-glow dark:border-slate-700/80 dark:bg-slate-950/90">
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Create your PrepVerse account</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Sign up with your email and start generating adaptive study material.</p>

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
              minLength={6}
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
            {loading ? 'Creating account…' : 'Sign up'}
          </button>

          {message ? <p className="text-sm text-slate-700 dark:text-slate-200">{message}</p> : null}
        </form>

        <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Sign up with mobile</h2>
          <div className="mt-4 flex gap-3">
            <input
              type="tel"
              required
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
