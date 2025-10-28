import './globals.css'
import AuthStatus from './components/AuthStatus'

import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://pan-predict.vercel.app'),
  title: {
    default: 'PanPredict',
    template: '%s · PanPredict',
  },
  description: 'Points-only prediction game',
  openGraph: {
    type: 'website',
    url: 'https://pan-predict.vercel.app',
    siteName: 'PanPredict',
    title: 'PanPredict — Points-only prediction game',
    description: 'Trade YES/NO shares on social events with friends. No money, points only.',
    images: [{ url: 'c:\Users\geree\OneDrive\Desktop\panpredict-favicon-pack\favicon.ico', width: 1200, height: 630, alt: 'PanPredict' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PanPredict',
    description: 'Points-only prediction game',
    images: ['c:\Users\geree\OneDrive\Desktop\panpredict-favicon-pack\favicon.ico'],
  },
  icons: { icon: 'c:\Users\geree\OneDrive\Desktop\panpredict-favicon-pack\favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800 p-3 flex justify-between">
          <a href="/" className="font-semibold">PanPredict</a>
          <AuthStatus />
        </header>
        <main className="p-4">{children}</main>
      </body>
    </html>
  )
}
