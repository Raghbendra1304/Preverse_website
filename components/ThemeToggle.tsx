'use client';

import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const activeTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="inline-flex items-center gap-2 rounded-full border border-slate-300/20 bg-slate-100/80 px-3 py-2 text-sm text-slate-800 shadow-sm transition hover:bg-slate-200 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
      onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
    >
      {activeTheme === 'dark' ? '🌙' : '☀️'}
      <span>{activeTheme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
}
