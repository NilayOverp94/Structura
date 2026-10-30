import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://structura-eosin.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Structura — Understand Any Codebase',
    template: '%s | Structura',
  },
  description: 'AI-powered repository intelligence platform. Understand software architecture, trace dependencies, and start contributing with confidence.',
  keywords: [
    'Structura',
    'codebase intelligence',
    'repository explorer',
    'AI code analysis',
    'software architecture',
    'open source onboarding',
    'RAG code assistant',
  ],
  authors: [{ name: 'Structura Team' }],
  creator: 'Structura',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appUrl,
    title: 'Structura — Understand Any Codebase',
    description: 'Explore unfamiliar codebases, software architecture, dependencies, and entry points with AI.',
    siteName: 'Structura',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Structura — Understand Any Codebase',
    description: 'AI-powered repository intelligence platform. Understand software architecture, trace dependencies, and start contributing with confidence.',
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
