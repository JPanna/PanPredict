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
      <body className="min-h-dvh bg-okx-bg text-okx-text">
        <div className="mx-auto max-w-md min-h-dvh flex flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-40 px-4 py-3 bg-okx-bg/70 backdrop-blur border-b border-okx-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-okx-lime" />
                <span className="font-semibold">PanPredict</span>
              </div>
              <a href="/portfolio" className="text-sm text-okx-sub">Portfolio</a>
            </div>
          </header>

          {/* Page */}
          <main className="flex-1 px-4 py-4">{children}</main>

          {/* Bottom nav */}
          <nav className="sticky bottom-0 z-40 border-t border-okx-border bg-okx-bg/80 backdrop-blur">
            <div className="mx-auto max-w-md grid grid-cols-3 text-sm">
              <a href="/" className="py-3 text-center">Markets</a>
              <a href="/new" className="py-3 text-center text-okx-lime">Create</a>
              <a href="/profile" className="py-3 text-center">Me</a>
            </div>
          </nav>
        </div>
      </body>
    </html>
  )
}
