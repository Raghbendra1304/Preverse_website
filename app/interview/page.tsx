'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';

type InterviewQuestion = {
  id: number;
  prompt: string;
};

type InterviewReview = {
  rating: number;
  summary: string;
  strengths: string;
  improvements: string;
};

const topics = ['Frontend', 'Backend', 'System Design', 'Behavioral', 'Data Science'];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

export default function InterviewPage() {
  const [topic, setTopic] = useState(topics[0]);
  const [difficulty, setDifficulty] = useState(difficulties[1]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [review, setReview] = useState<InterviewReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questions.length && currentIndex < questions.length) {
      setAnswer(answers[questions[currentIndex].id] ?? '');
    }
  }, [currentIndex, questions, answers]);

  const currentQuestion = questions[currentIndex];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setReview(null);
    setAnswers({});
    setCurrentIndex(0);
    setAnswer('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'generate_interview', topic, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to generate interview questions.');
      }
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error while generating interview questions.');
    } finally {
      setLoading(false);
    }
  };

  const moveToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setAnswers((prev) => ({ ...prev, [questions[currentIndex]?.id ?? index]: answer }));
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    if (!questions.length) return;
    setLoading(true);
    setError(null);
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'interview_review',
          topic,
          difficulty,
          questions,
          answers: { ...answers, [currentQuestion.id]: answer },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Could not generate review.');
      }

      setReview({
        rating: data.rating ?? 4,
        summary: data.summary ?? 'Your responses have been reviewed and scored by AI.',
        strengths: data.strengths ?? 'Your answers showed a strong understanding of the core topic.',
        improvements: data.improvements ?? 'Try adding more specific examples and structure to your explanations.',
      });

      const supabase = createBrowserSupabaseClient();
      const { data: userSession } = await supabase.auth.getSession();
      const user = userSession?.session?.user;
      if (user) {
        await supabase.from('attempts').insert([
          {
            user_id: user.id,
            type: 'interview',
            topic,
            difficulty,
            score: Object.values({ ...answers, [currentQuestion.id]: answer }).filter(Boolean).length,
            total: questions.length,
            details: {
              questions: questions.map((item) => item.prompt),
              answers: { ...answers, [currentQuestion.id]: answer },
            },
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mx-auto py-16">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-10 shadow-glow dark:border-slate-700/80 dark:bg-slate-950/90">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Mock interview</h1>
              <p className="mt-3 text-slate-600 dark:text-slate-300">Practice interview-style questions and get AI coaching on your answers.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">Type your best answer below</span>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              Topic
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
              >
                {topics.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              Difficulty
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
              >
                {difficulties.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Preparing questions…' : 'Start mock interview'}
            </button>
            {questions.length ? (
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                Complete session
              </button>
            ) : null}
          </div>

          {error ? <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          {questions.length ? (
            <div className="mt-10 space-y-6">
              <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-6 dark:border-slate-700/70 dark:bg-slate-900/80">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Question {currentIndex + 1} of {questions.length}</p>
                <h2 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">{currentQuestion?.prompt}</h2>
              </div>

              <label className="block">
                <span className="sr-only">Your answer</span>
                <textarea
                  rows={8}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Type your answer here..."
                  className="mt-3 w-full rounded-3xl border border-slate-300 bg-white px-4 py-4 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={handlePrevious}
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentIndex >= questions.length - 1}
                  onClick={handleNext}
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {review ? (
            <div className="mt-10 rounded-[2rem] border border-slate-200/80 bg-slate-50 p-8 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/90">
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Interview review</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 dark:bg-slate-950">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Rating</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{review.rating}/5</p>
                </div>
                <div className="rounded-3xl bg-white p-5 dark:bg-slate-950">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Recommended focus</p>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">{review.improvements}</p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white p-6 dark:border-slate-700/70 dark:bg-slate-950">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Summary</h3>
                <p className="mt-4 text-slate-600 dark:text-slate-300">{review.summary}</p>
              </div>
              <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white p-6 dark:border-slate-700/70 dark:bg-slate-950">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Strengths</h3>
                <p className="mt-4 text-slate-600 dark:text-slate-300">{review.strengths}</p>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-slate-50 p-8 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Interview flow</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Generate tailored questions, respond in writing, and let AI turn your interview practice into meaningful feedback.</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-glow dark:border-slate-700/80 dark:bg-slate-950/90">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Quick tip</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Answer each question in a structured way: situation, action, result for behavioral prompts, and technical clarity for system design questions.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
