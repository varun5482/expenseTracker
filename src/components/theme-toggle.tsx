'use client';

import { MoonStar, SunMedium } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="ghost-button" onClick={toggleTheme} type="button" aria-label="Toggle theme">
      {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
    </button>
  );
}
