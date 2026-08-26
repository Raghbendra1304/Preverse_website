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
  results: Array<{ id: number; correct: boolean; selectedAnswer: string; correctAnswer: string; explanation: string }>;
};

const difficulties = ['Easy', 'Medium', 'Hard'];
const examTracks = [
  {
    name: 'Government Exams',
    description: 'UPSC, SSC, Banking, Railways, Defence, and State PSC',
    subjects: [
      { name: 'General Studies', chapters: ['Indian History', 'Indian Polity', 'Geography', 'Economy'] },
      { name: 'Aptitude', chapters: ['Quantitative Aptitude', 'Logical Reasoning', 'Data Interpretation', 'English'] },
      { name: 'Current Affairs', chapters: ['National News', 'International News', 'Science and Technology', 'Government Schemes'] },
    ],
  },
  {
    name: 'NEET',
    description: 'Medical entrance preparation',
    subjects: [
      { name: 'Physics', chapters: ['Mechanics', 'Thermodynamics', 'Electrodynamics', 'Modern Physics'] },
      { name: 'Chemistry', chapters: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Chemical Bonding'] },
      { name: 'Biology', chapters: ['Cell Biology', 'Human Physiology', 'Genetics', 'Ecology'] },
    ],
  },
  {
    name: 'JEE Main',
    description: 'Engineering entrance preparation',
    subjects: [
      { name: 'Physics', chapters: ['Mechanics', 'Electrodynamics', 'Optics', 'Modern Physics'] },
      { name: 'Chemistry', chapters: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Coordination Compounds'] },
      { name: 'Mathematics', chapters: ['Calculus', 'Algebra', 'Coordinate Geometry', 'Vectors and 3D'] },
    ],
  },
  {
    name: 'JEE Advanced',
    description: 'Advanced engineering entrance preparation',
    subjects: [
      { name: 'Advanced Physics', chapters: ['Rotational Dynamics', 'Fluid Mechanics', 'Electromagnetic Induction', 'Wave Optics'] },
      { name: 'Advanced Chemistry', chapters: ['Ionic Equilibrium', 'Organic Reactions', 'Molecular Structure', 'Electrochemistry'] },
      { name: 'Advanced Mathematics', chapters: ['Complex Numbers', 'Advanced Calculus', 'Combinatorics', 'Conic Sections'] },
    ],
  },
  {
    name: 'Science Olympiad',
    description: 'School science olympiad preparation',
    subjects: [
      { name: 'Physics', chapters: ['Motion and Forces', 'Energy', 'Electricity', 'Light and Sound'] },
      { name: 'Chemistry', chapters: ['Matter', 'Atoms and Molecules', 'Chemical Reactions', 'Acids and Bases'] },
      { name: 'Biology', chapters: ['Living Systems', 'Plants', 'Animals', 'Environment'] },
    ],
  },
  {
    name: 'Mathematics Olympiad',
    description: 'Problem-solving and proof preparation',
    subjects: [
      { name: 'Number Theory', chapters: ['Divisibility', 'Prime Numbers', 'Congruences', 'Diophantine Equations'] },
      { name: 'Geometry', chapters: ['Triangles', 'Circles', 'Transformations', 'Geometric Inequalities'] },
      { name: 'Algebra', chapters: ['Polynomials', 'Inequalities', 'Functional Equations', 'Sequences'] },
    ],
  },
  {
    name: 'Informatics Olympiad',
    description: 'Competitive programming preparation',
    subjects: [
      { name: 'Algorithms', chapters: ['Sorting and Searching', 'Greedy Algorithms', 'Dynamic Programming', 'Graph Theory'] },
      { name: 'Data Structures', chapters: ['Arrays and Strings', 'Trees', 'Heaps', 'Hashing'] },
      { name: 'Competitive Programming', chapters: ['Complexity', 'Recursion', 'Combinatorics', 'Problem Solving'] },
    ],
  },
];

export default function PracticePage() {
  const [exam, setExam] = useState(examTracks[0].name);
  const [subject, setSubject] = useState(examTracks[0].subjects[0].name);
  const [chapter, setChapter] = useState(examTracks[0].subjects[0].chapters[0]);
  const [testMode, setTestMode] = useState<'practice' | 'full_mock'>('practice');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState(difficulties[1]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(150);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [coins, setCoins] = useState(50);
  const [coinDelta, setCoinDelta] = useState<number | null>(null);
  const selectedTrack = examTracks.find((track) => track.name === exam) ?? examTracks[0];
  const selectedSubject = selectedTrack.subjects.find((item) => item.name === subject) ?? selectedTrack.subjects[0];
  const topic = `${subject}: ${chapter}`;
  const testDuration = testMode === 'full_mock' ? 3600 : questionCount * 45;

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

  useEffect(() => {
    async function checkAuth() {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      setSignedIn(Boolean(data.session?.user));
      setAuthChecked(true);
    }
    void checkAuth();
  }, []);

  const currentQuestion = questions[activeIndex];
  const progress = questions.length ? Math.round(((activeIndex + 1) / questions.length) * 100) : 0;

  const handleGenerate = async () => {
    if (!signedIn) {
      window.location.href = '/signin?next=/practice';
      return;
    }
    setLoading(true);
    setError(null);
    setFeedback(null);
    setTimeLeft(testDuration);
    try {
      const authClient = createBrowserSupabaseClient();
      const { data: sessionData } = await authClient.auth.getSession();
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session?.access_token ?? ''}` },
        body: JSON.stringify({ mode: 'generate_practice', exam, topic, difficulty, questionCount, testMode }),
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
      const authClient = createBrowserSupabaseClient();
      const { data: sessionData } = await authClient.auth.getSession();
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session?.access_token ?? ''}` },
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
        results: data.results ?? questions.map((question) => ({
          id: question.id,
          correct: question.type === 'multiple_choice' ? answers[question.id] === question.answer : Boolean(answers[question.id]?.trim()),
          selectedAnswer: answers[question.id] ?? '',
          correctAnswer: question.answer,
          explanation: 'Review this response against the correct answer.',
        })),
      });
      const earnedCoins = submission.correct * 5 - (submission.total - submission.correct) * 2;
      const nextCoins = Math.max(0, coins + earnedCoins);
      setCoins(nextCoins);
      setCoinDelta(earnedCoins);
      window.localStorage.setItem('prepverse-coins', String(nextCoins));

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

  useEffect(() => {
    const savedCoins = window.localStorage.getItem('prepverse-coins');
    if (savedCoins) setCoins(Math.max(0, Number(savedCoins) || 0));
  }, []);

  const watchRewardedAd = () => {
    // Replace this demo reward with a verified ad-network callback in production.
    const nextCoins = coins + 20;
    setCoins(nextCoins);
    setCoinDelta(20);
    window.localStorage.setItem('prepverse-coins', String(nextCoins));
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

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Wallet</p>
              <p className="mt-1 text-2xl font-semibold text-amber-950 dark:text-amber-100">{coins} coins</p>
              {coinDelta !== null ? <p className={`text-sm ${coinDelta >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{coinDelta >= 0 ? '+' : ''}{coinDelta} coins this test</p> : null}
            </div>
            {coins === 0 ? (
              <button type="button" onClick={watchRewardedAd} className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600">
                Watch ad for 20 coins
              </button>
            ) : null}
          </div>

          {!questions.length ? <div className="mt-8 grid gap-6 sm:grid-cols-5">
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              Exam
              <select
                value={exam}
                onChange={(event) => {
                  const nextExam = event.target.value;
                  const nextTrack = examTracks.find((track) => track.name === nextExam) ?? examTracks[0];
                  setExam(nextExam);
                  setSubject(nextTrack.subjects[0].name);
                  setChapter(nextTrack.subjects[0].chapters[0]);
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
              Subject
              <select
                value={subject}
                onChange={(event) => {
                  const nextSubject = event.target.value;
                  const nextSubjectData = selectedTrack.subjects.find((item) => item.name === nextSubject) ?? selectedTrack.subjects[0];
                  setSubject(nextSubject);
                  setChapter(nextSubjectData.chapters[0]);
                }}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
              >
                {selectedTrack.subjects.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              Chapter
              <select
                value={chapter}
                onChange={(event) => setChapter(event.target.value)}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
              >
                {selectedSubject.chapters.map((value) => (
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
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              Test mode
              <select
                value={testMode}
                onChange={(event) => setTestMode(event.target.value as 'practice' | 'full_mock')}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
              >
                <option value="practice">Topic practice</option>
                <option value="full_mock">Full mock test</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              Questions
              <select
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
                disabled={testMode === 'full_mock'}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-700/30"
              >
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
                <option value={20}>20 questions</option>
              </select>
            </label>
          </div> : null}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {!authChecked ? <p className="rounded-lg bg-[#f7d8c8] px-4 py-3 text-sm font-semibold text-[#202b2a]">Checking your account...</p> : !signedIn ? <p className="rounded-lg bg-[#f7d8c8] px-4 py-3 text-sm font-semibold text-[#202b2a]">Sign in to take a test.</p> : null}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !authChecked}
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
              <div className="mt-6 space-y-3">
                {feedback.results.map((result, index) => (
                  <div key={result.id} className={`rounded-3xl border p-5 ${result.correct ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'}`}>
                    <p className={`font-semibold ${result.correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                      Question {index + 1}: {result.correct ? 'Correct answer' : 'Wrong answer'}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your answer: {result.selectedAnswer || 'Not answered'}</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Correct answer: {result.correctAnswer}</p>
                    {!result.correct && result.explanation ? <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-600 dark:text-slate-300">{result.explanation}</p> : null}
                  </div>
                ))}
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
