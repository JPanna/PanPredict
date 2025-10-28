'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type WalletRow = { points: number }

export default function MePage() {
  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)

  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  // Load current user + wallet
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!alive) return

      if (user) {
        setUserId(user.id)
        setUserEmail(user.email ?? null)

        const { data: w } = await supabase
          .from('wallets')
          .select('points')
          .eq('user_id', user.id)
          .single<WalletRow>()
        if (!alive) return
        setPoints(w?.points ?? null)
      }

      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  async function sendMagicLink() {
    setMsg(null)
    if (!email) { setMsg('Enter your email first'); return }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/me` }
      })
      if (error) throw error
      setMsg('Check your email for a sign-in link.')
    } catch (e: any) {
      setMsg(e.message ?? 'Failed to send magic link')
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    location.reload()
  }

  if (loading) return <div className="p-6">Loading…</div>

  // Signed-out view
  if (!userId) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full bg-transparent border border-okx-border rounded-lg px-3 py-2 mb-3"
        />
        <button
          onClick={sendMagicLink}
          className="w-full bg-brand text-black rounded-lg py-2 font-medium"
        >
          Send magic link
        </button>
        {msg && <p className="text-sm text-neutral-400 mt-3">{msg}</p>}
      </div>
    )
  }

  // Signed-in view
  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Account</h1>

      <div className="rounded-xl border border-okx-border p-4">
        <div className="text-sm text-neutral-400">Signed in as</div>
        <div className="text-lg">{userEmail ?? userId}</div>
      </div>

      <div className="rounded-xl border border-okx-border p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-400">Points</div>
          <div className="text-2xl">{points ?? '—'}</div>
        </div>
        <Link
          href="/portfolio"
          className="px-3 py-2 rounded-lg border border-okx-border hover:bg-neutral-800"
        >
          Portfolio
        </Link>
      </div>

      <button
        onClick={signOut}
        className="text-sm text-neutral-300 border border-okx-border rounded-lg px-3 py-2 hover:bg-neutral-800"
      >
        Sign out
      </button>
    </div>
  )
}
