import Script from 'next/script';

export function ThemeScript() {
  return (
    <Script id="theme-script" strategy="beforeInteractive">
      {`
        try {
          const stored = window.localStorage.getItem('expense-theme');
          const theme = stored === 'dark' || stored === 'light' ? stored : 'light';
          document.documentElement.dataset.theme = theme;
        } catch (error) {
          document.documentElement.dataset.theme = 'light';
        }
      `}
    </Script>
  );
}
