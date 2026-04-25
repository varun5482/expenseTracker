import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { PwaRegister } from '@/components/pwa-register';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeScript } from '@/components/theme-script';
import { ThemeToggle } from '@/components/theme-toggle';
import { getCurrentProfile } from '@/lib/auth';

import './globals.css';

export const metadata: Metadata = {
  title: 'Expense PWA',
  description: 'Track expenses, savings, recurring spends, and splits in a mobile-friendly PWA.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#0f172a'
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const profile = await getCurrentProfile();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeScript />
        <ThemeProvider>
          <div className="app-shell">
            <header className="app-header">
              <div>
                <p className="eyebrow">Expense tracker</p>
                <h1>Personal finance dashboard</h1>
                {profile ? <p className="panel-copy">Signed in as @{profile.username}</p> : null}
              </div>
              <nav className="app-nav">
                {profile ? (
                  <>
                    <Link href="/">Dashboard</Link>
                    <Link href="/settings">Settings</Link>
                    <PwaRegister />
                    <ThemeToggle />
                    <SignOutButton />
                  </>
                ) : (
                  <>
                    <ThemeToggle />
                    <Link href="/auth">Login</Link>
                  </>
                )}
              </nav>
            </header>
            <main>{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
