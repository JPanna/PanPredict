import './globals.css'
import AuthStatus from './components/AuthStatus'

export const metadata = { title: 'OXK Markets', description: 'Points-only prediction game' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800 p-3 flex justify-between">
          <a href="/" className="font-semibold">OXK Markets</a>
          <AuthStatus />
        </header>
        <main className="p-4">{children}</main>
      </body>
    </html>
  )
}
