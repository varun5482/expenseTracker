import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Expense PWA',
    short_name: 'Expenses',
    description: 'Track expenses, shared spends, and monthly savings.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1020',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };
}
