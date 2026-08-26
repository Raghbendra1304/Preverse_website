'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';

type AttemptRecord = {
  id: string;
  topic: string;
  difficulty: string;
  score: number;
  total: number;
  type: string;
  created_at: string;
};

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      setUserEmail(user.email ?? null);
      const { data, error } = await supabase
        .from('attempts')
        .select('id, topic, difficulty, score, total, type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setAttempts(data);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const totalCompleted = attempts.length;
  const averageScore = useMemo(
    () => (attempts.length ? Math.round((attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.reduce((sum, attempt) => sum + attempt.total, 0)) * 100) : 0),
    [attempts]
  );

  const streak = useMemo(() => {
    if (!attempts.length) {
      return 0;
    }
    const recentDates = new Set<string>();
    attempts.forEach((attempt) => {
      const date = attempt.created_at.slice(0, 10);
      recentDates.add(date);
    });
    return recentDates.size;
  }, [attempts]);

  const topicCounts = useMemo(() => {
    return attempts.reduce<Record<string, number>>((map, attempt) => {
      map[attempt.topic] = (map[attempt.topic] ?? 0) + 1;
      return map;
    }, {});
  }, [attempts]);

  return (
    <section className="container mx-auto py-16">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-10 shadow-glow dark:border-slate-700/80 dark:bg-slate-950/90">
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Your dashboard</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Review your recent progress, practice sessions, and study patterns.
            </p>

            {loading ? (
              <p className="mt-6 text-slate-600 dark:text-slate-300">Loading your progress...</p>
            ) : !userEmail ? (
              <p className="mt-6 text-slate-600 dark:text-slate-300">Please sign in to view your personalized dashboard.</p>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-6 dark:border-slate-700/70 dark:bg-slate-900/80">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Attempts</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">{totalCompleted}</p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-6 dark:border-slate-700/70 dark:bg-slate-900/80">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Average score</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">{averageScore}%</p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-6 dark:border-slate-700/70 dark:bg-slate-900/80">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Active streak</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">{streak} days</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-10 shadow-glow dark:border-slate-700/80 dark:bg-slate-950/90">
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Recent practice activity</h2>
            {loading ? (
              <p className="mt-4 text-slate-600 dark:text-slate-300">Loading attempts...</p>
            ) : attempts.length ? (
              <div className="mt-6 space-y-4">
                {attempts.map((attempt) => (
                  <div key={attempt.id} className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">{attempt.topic}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{attempt.type === 'interview' ? 'Mock interview' : 'Practice session'} • {attempt.difficulty}</p>
                      </div>
                      <div className="rounded-full bg-violet-600/10 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                        {Math.round((attempt.score / Math.max(attempt.total, 1)) * 100)}%
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{new Date(attempt.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-slate-600 dark:text-slate-300">No completed sessions yet. Start a practice quiz or mock interview to build your record.</p>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-glow dark:border-slate-700/80 dark:bg-slate-950/90">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Anchor your study</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Choose a topic, test your knowledge, and let AI show you where to focus next.</p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Top topic</p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{Object.keys(topicCounts)[0] ?? 'No activity yet'}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Keep practicing</p>
                <p className="mt-2 text-base text-slate-600 dark:text-slate-300">Continue with timed quizzes, interview rounds, or target your weakest topics.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-slate-50 p-8 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Next steps</h3>
            <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
              <li>• Generate a topic-based practice quiz.</li>
              <li>• Run through a mock interview session.</li>
              <li>• Track your score improvement over time.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
