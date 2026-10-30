import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Structura — Understand Any Codebase',
  description: 'AI-powered repository intelligence platform. Understand software architecture, trace dependencies, and start contributing with confidence.',
  keywords: ['Structura', 'codebase intelligence', 'repository explorer', 'AI code analysis', 'software architecture', 'open source'],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
