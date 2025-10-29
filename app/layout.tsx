import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from './components/BottomNav'
import AuthStatus from './components/AuthStatus'

export const metadata: Metadata = {
  title: 'PanPredict',
  description: 'Points-only prediction game',
  icons: {
    icon: '/favicon.ico',            // keep a 32x32 .ico for the tab
    shortcut: '/favicon.ico',
    apple: '/panpredict-logo.svg',   // iOS homescreen
  },
  openGraph: {
    title: 'PanPredict',
    description: 'Points-only prediction game',
    images: ['/panpredict-logo.svg'],  // (better: a 1200×630 OG image later)
  },
  twitter: {
    card: 'summary',
    images: ['/panpredict-logo.svg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="mx-auto max-w-screen-sm min-h-[100dvh] flex flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-40 border-b border-okx-border bg-black/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 h-12">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/panpredict-logo.svg"
                  alt="PanPredict"
                  width={24}
                  height={24}
                  priority
                />
                <span className="font-semibold">PanPredict</span>
              </Link>

              <div className="flex items-center gap-4">
                <Link href="/portfolio" className="text-sm">Portfolio</Link>
                <AuthStatus />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 pb-16">{children}</main>

          {/* Bottom nav */}
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
