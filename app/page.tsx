import Link from 'next/link';

const features = [
  {
    title: 'AI Practice Questions',
    description: 'Generate personalized exam, coding, and verbal questions for every topic and difficulty level.',
  },
  {
    title: 'Smart Feedback',
    description: 'Get AI-guided explanations, score breakdowns, and improvement tips after every attempt.',
  },
  {
    title: 'Mock Interview Mode',
    description: 'Simulate job interviews with sequential questions, record answers, and receive a review.',
  },
  {
    title: 'Progress Tracking',
    description: 'Visualize streaks, strengths, and completed attempts with activity charts and history.',
  },
];

export default function Home() {
  return (
    <section className="container mx-auto py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-200">
            AI-powered learning for exams and interviews
          </div>
          <div className="space-y-6">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Prepare with confidence, practice with AI, and land your next opportunity.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              PrepVerse combines personalized question generation, guided feedback, and progress tracking for government exams, NEET, JEE, and olympiad preparation.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500">
              Start preparing
            </Link>
            <Link href="/signin" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/90 dark:text-white">
              Sign in
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-glow backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/90">
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg dark:bg-slate-800">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Launch your growth plan</p>
              <h2 className="mt-4 text-3xl font-semibold">Interactive practice, real-time review.</h2>
              <p className="mt-3 text-slate-300">From timed quizzes to mock interviews, PrepVerse helps you focus where improvement matters most.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <article key={feature.title} className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-950/80">
                  <h3 className="text-base font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-6 rounded-[2rem] border border-slate-200/70 bg-slate-50 p-8 text-slate-900 shadow-sm dark:border-slate-700/70 dark:bg-slate-950/80 dark:text-slate-100 sm:grid-cols-3">
        <div>
          <p className="text-3xl font-semibold">20+</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Question sets and mock interview experiences</p>
        </div>
        <div>
          <p className="text-3xl font-semibold">AI-driven feedback</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Understand exactly what to improve after every attempt.</p>
        </div>
        <div>
          <p className="text-3xl font-semibold">Practice on demand</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Choose topics, difficulty, and format with an intuitive workflow.</p>
        </div>
      </div>
    </section>
  );
}
