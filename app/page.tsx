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

const tracks = [
  { label: 'Government exams', detail: 'UPSC, PCS, SSC, Banking, Railways', tone: 'bg-[#dbead5]' },
  { label: 'NEET', detail: 'Physics, Chemistry, Biology', tone: 'bg-[#f7d8c8]' },
  { label: 'JEE', detail: 'Main and Advanced preparation', tone: 'bg-[#d9e5ec]' },
  { label: 'Olympiads', detail: 'Maths, Science, Informatics', tone: 'bg-[#eee2b8]' },
];

export default function Home() {
  return (
    <section className="container mx-auto py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="space-y-8">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#de754d]">Your daily preparation desk</p>
          <h1 className="display-font max-w-3xl text-5xl leading-[1.02] text-[#202b2a] dark:text-[#edf2e9] sm:text-7xl">Small sessions.<br /><span className="text-[#3e786b]">Serious progress.</span></h1>
          <p className="max-w-xl text-lg leading-8 text-[#5c6965] dark:text-[#afbeb4]">One calm place to prepare for government exams, NEET, JEE, and olympiads with focused tests, instant feedback, and a record of every step forward.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/practice" className="inline-flex items-center justify-center rounded-lg bg-[#202b2a] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3e786b]">Start a practice test <span className="ml-3">→</span></Link>
            <Link href="/signup" className="inline-flex items-center justify-center rounded-lg border border-[#202b2a]/20 px-6 py-3 text-sm font-bold text-[#202b2a] transition hover:border-[#de754d] dark:border-[#edf2e9]/20 dark:text-[#edf2e9]">Create account</Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[1.75rem] bg-[#202b2a] p-7 text-[#edf2e9] shadow-[0_24px_70px_-30px_rgba(32,43,42,0.8)] sm:p-9">
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full border-[18px] border-[#de754d]/50" />
          <p className="relative text-xs font-bold uppercase tracking-[0.25em] text-[#b8d1b2]">Today&apos;s focus</p>
          <h2 className="display-font relative mt-5 max-w-sm text-4xl leading-tight">Choose a track. We&apos;ll bring the challenge.</h2>
          <div className="relative mt-10 grid gap-3 sm:grid-cols-2">
            {tracks.map((track) => <div key={track.label} className={`${track.tone} rounded-xl p-4 text-[#202b2a]`}><p className="font-bold">{track.label}</p><p className="mt-1 text-xs opacity-75">{track.detail}</p></div>)}
          </div>
        </div>
      </div>
      <div className="mt-14 grid gap-4 border-y border-[#202b2a]/10 py-6 dark:border-[#edf2e9]/10 sm:grid-cols-3">
        <div><p className="text-2xl font-bold text-[#202b2a] dark:text-[#edf2e9]">01</p><p className="mt-1 text-sm text-[#5c6965] dark:text-[#afbeb4]">Pick your exam and chapter</p></div>
        <div><p className="text-2xl font-bold text-[#202b2a] dark:text-[#edf2e9]">02</p><p className="mt-1 text-sm text-[#5c6965] dark:text-[#afbeb4]">Take a timed Gemini test</p></div>
        <div><p className="text-2xl font-bold text-[#202b2a] dark:text-[#edf2e9]">03</p><p className="mt-1 text-sm text-[#5c6965] dark:text-[#afbeb4]">Learn from every mistake</p></div>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => <article key={feature.title} className="border-l-2 border-[#de754d] pl-4"><h3 className="font-bold text-[#202b2a] dark:text-[#edf2e9]">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-[#5c6965] dark:text-[#afbeb4]">{feature.description}</p></article>)}
      </div>
    </section>
  );
}
