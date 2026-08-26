import './globals.css';
import type { Metadata } from 'next';
import ThemeProvider from '@/components/ThemeProvider';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'PrepVerse',
  description: 'AI-powered exam and interview preparation platform for study, practice, and feedback.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.14),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.1),_transparent_25%),var(--bg)] text-slate-900 dark:text-slate-100">
            <NavBar />
            <main>{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
