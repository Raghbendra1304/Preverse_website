'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';

type PracticeQuestion = {
  id: number;
  type: 'multiple_choice' | 'coding' | 'verbal';
  text: string;
  options?: string[];
  answer: string;
};

type FeedbackResponse = {
  score: number;
  correct: number;
  total: number;
  explanation: string;
};

const difficulties = ['Easy', 'Medium', 'Hard'];
const examTracks = [
  {
    name: 'Government Exams',
    description: 'UPSC, SSC, Banking, Railways, Defence, and State PSC',
    topics: ['General Knowledge', 'Current Affairs', 'Quantitative Aptitude', 'Reasoning', 'English', 'Indian Polity'],
  },
  {
    name: 'NEET',
    description: 'Medical entrance preparation',
    topics: ['Physics', 'Chemistry', 'Botany', 'Zoology', 'Human Physiology', 'Organic Chemistry'],
  },
  {
    name: 'JEE Main',
    description: 'Engineering entrance preparation',
    topics: ['Physics', 'Chemistry', 'Mathematics', 'Mechanics', 'Electrodynamics', 'Calculus'],
  },
  {
    name: 'JEE Advanced',
    description: 'Advanced engineering entrance preparation',
    topics: ['Advanced Physics', 'Advanced Chemistry', 'Advanced Mathematics', 'IIT Mechanics', 'Organic Reactions', 'Coordinate Geometry'],
  },
  {
    name: 'Science Olympiad',
    description: 'School science olympiad preparation',
    topics: ['Physics', 'Chemistry', 'Biology', 'Earth Science', 'Scientific Reasoning', 'Experimental Science'],
  },
  {
    name: 'Mathematics Olympiad',
    description: 'Problem-solving and proof preparation',
    topics: ['Number Theory', 'Combinatorics', 'Geometry', 'Algebra', 'Inequalities', 'Proof Writing'],
  },
  {
    name: 'Informatics Olympiad',
    description: 'Competitive programming preparation',
    topics: ['Algorithms', 'Data Structures', 'Dynamic Programming', 'Graph Theory', 'Combinatorics', 'Competitive Programming'],
  },
];

export default function PracticePage() {
  const [exam, setExam] = useState(examTracks[0].name);
  const [topic, setTopic] = useState(examTracks[0].topics[0]);
  const [difficulty, setDifficulty] = useState(difficulties[1]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(150);
  const selectedTrack = examTracks.find((track) => track.name === exam) ?? examTracks[0];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (questions.length > 0 && !feedback) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [questions, feedback]);

  const currentQuestion = questions[activeIndex];
  const progress = questions.length ? Math.round(((activeIndex + 1) / questions.length) * 100) : 0;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    setTimeLeft(150);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'generate_practice', exam, topic, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Could not generate questions.');
      }
      setQuestions(data.questions || []);
      setAnswers({});
      setActiveIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error while generating questions.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const computeScore = () => {
    let score = 0;
    let correct = 0;
    questions.forEach((question) => {
      const answer = answers[question.id]?.trim() ?? '';
      if (question.type === 'multiple_choice') {
        if (answer && answer === question.answer) {
          score += 1;
          correct += 1;
        }
      } else if (answer) {
        score += 1;
        correct += 1;
      }
    });
    return { score, correct, total: questions.length };
  };

  const handleSubmit = async () => {
    if (!questions.length || feedback) return;
    setLoading(true);
    setError(null);
    const submission = computeScore();

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'submit_feedback',
          exam,
          topic,
          difficulty,
          questions,
          answers,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Feedback generation failed.');
      }
      setFeedback({
        score: submission.score,
        correct: submission.correct,
        total: submission.total,
        explanation: data.explanation ?? 'Review completed successfully.',
      });

      const supabase = createBrowserSupabaseClient();
      const { data: userSession } = await supabase.auth.getSession();
      const user = userSession?.session?.user;
      if (user) {
        await supabase.from('attempts').insert([
          {
            user_id: user.id,
            type: 'practice',
            topic,
            difficulty,
            score: submission.score,
            total: submission.total,
            details: {
              questions: questions.map((question) => ({ text: question.text, type: question.type, answer: question.answer })),
              answers,
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

  const questionContent = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-6 dark:border-slate-700/70 dark:bg-slate-900/80">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Question {activeIndex + 1} of {questions.length}</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">{currentQuestion.text}</h2>
        </div>

        {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
          <div className="grid gap-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleAnswer(currentQuestion.id, option)}
                className={`rounded-3xl border px-5 py-4 text-left transition ${answers[currentQuestion.id] === option ? 'border-violet-600 bg-violet-600/10 text-violet-900 dark:text-violet-200' : 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'}`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <label className="block">
            <span className="sr-only">Answer</span>
            <textarea
              value={answers[currentQuestion.id] ?? ''}
              onChange={(event) => handleAnswer(currentQuestion.id, event.target.value)}
              rows={6}
              placeholder="Type your answer here..."
              className="mt-3 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <section className="container mx-auto py-16">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-10 shadow-glow dark:border-slate-700/80 dark:bg-slate-950/90">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Practice mode</h1>
              <p className="mt-3 text-slate-600 dark:text-slate-300">Generate focused questions for the topic you want to master.</p>
              <p className="mt-2 text-sm font-medium text-violet-700 dark:text-violet-300">{selectedTrack.description}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Timer: {timeLeft}s
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              Exam
              <select
                value={exam}
                onChange={(event) => {
                  const nextExam = event.target.value;
                  const nextTrack = examTracks.find((track) => track.name === nextExam) ?? examTracks[0];
                  setExam(nextExam);
                  setTopic(nextTrack.topics[0]);
                }}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
              >
                {examTracks.map((track) => (
                  <option key={track.name} value={track.name}>
                    {track.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              Topic
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
              >
                {selectedTrack.topics.map((value) => (
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
              {loading ? 'Generating questions…' : 'Generate practice set'}
            </button>
            {questions.length ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                Submit answers
              </button>
            ) : null}
          </div>

          {error ? <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          {questions.length ? (
            <div className="mt-10 space-y-6">
              <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Progress</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{progress}% complete</p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-violet-600" style={{ width: `${progress}%` }} />
                </div>
              </div>
              {questionContent()}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={activeIndex <= 0}
                  onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={activeIndex >= questions.length - 1}
                  onClick={() => setActiveIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {feedback ? (
            <div className="mt-10 rounded-[2rem] border border-slate-200/80 bg-slate-50 p-8 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/90">
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Your results</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white p-5 dark:bg-slate-950">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Score</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{feedback.score}/{feedback.total}</p>
                </div>
                <div className="rounded-3xl bg-white p-5 dark:bg-slate-950">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Correct answers</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{feedback.correct}</p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white p-6 dark:border-slate-700/70 dark:bg-slate-950">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">AI feedback</h3>
                <p className="mt-4 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{feedback.explanation}</p>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-slate-50 p-8 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">How it works</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Choose a topic and difficulty, then generate a set of AI-driven questions. Answer each prompt and submit to receive step-by-step guidance.</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-glow dark:border-slate-700/80 dark:bg-slate-950/90">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Tip</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Use the timer to build test-style focus. If you get stuck, move to the next question and review weak points with AI feedback.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
