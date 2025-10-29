// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

import BottomNav from './components/BottomNav'
import AuthStatus from './components/AuthStatus'

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
    description:
      'Trade YES/NO shares on social events with friends. No money, points only.',
    // Put an OG image in /public if you have one (e.g., /og.png). Fallback to favicon.
    images: [{ url: '/favicon.ico' }],
  },
  twitter: {
    card: 'summary',
    title: 'PanPredict',
    description: 'Points-only prediction game',
    images: ['/favicon.ico'],
  },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-okx-bg text-okx-text">
        <div className="mx-auto max-w-md min-h-[100dvh] flex flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-40 bg-okx-bg/70 backdrop-blur border-b border-okx-border">
            <div className="h-12 px-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-okx-lime inline-block" />
                <span className="font-semibold">PanPredict</span>
              </Link>

              <div className="flex items-center gap-3">
                <Link
                  href="/portfolio"
                  className="text-sm text-okx-sub hover:text-white"
                >
                  Portfolio
                </Link>
                <AuthStatus />
              </div>
            </div>
          </header>

          {/* Page content (pad bottom so it doesn't hide under bottom nav) */}
          <main className="flex-1 px-4 py-4 pb-16">{children}</main>

          {/* Bottom nav */}
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
