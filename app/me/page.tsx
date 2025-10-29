'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type WalletRow = { points: number }
type PositionRow = { event_id: string; side: 'YES' | 'NO'; qty: number }
type EventRow = { id: string; title: string; status: string }
type StateRow = { event_id: string; b: number; q_yes: number; q_no: number }

export default function MePage() {
  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const [points, setPoints] = useState<number | null>(null)
  const [positions, setPositions] = useState<PositionRow[]>([])
  const [eventsById, setEventsById] = useState<Record<string, EventRow>>({})
  const [stateByEvent, setStateByEvent] = useState<Record<string, StateRow>>({})

  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // ---- helpers ----
  const yesPrice = (st?: StateRow): number => {
    if (!st) return 0.5
    const { b, q_yes, q_no } = st
    const ey = Math.exp((Number(q_yes) || 0) / (Number(b) || 1))
    const en = Math.exp((Number(q_no) || 0) / (Number(b) || 1))
    if (!isFinite(ey) || !isFinite(en)) return 0.5
    return ey / (ey + en)
  }

  // total estimated value of positions at current prices
  const totalValue = useMemo(() => {
    if (!positions?.length) return 0
    let sum = 0
    for (const p of positions) {
      const st = stateByEvent[p.event_id]
      const pYes = yesPrice(st)
      const price = p.side === 'YES' ? pYes : (1 - pYes)
      sum += Number(p.qty) * price
    }
    return Math.round(sum * 100) / 100
  }, [positions, stateByEvent])

  // ---- load user + wallet + positions ----
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setErr(null)
        setLoading(true)

        // who am I
        const { data: { user } } = await supabase.auth.getUser()
        if (!alive) return
        if (!user) {
          setUserId(null)
          setUserEmail(null)
          setLoading(false)
          return
        }
        setUserId(user.id)
        setUserEmail(user.email ?? null)

        // wallet (create default if missing)
        const { data: w, error: wErr } = await supabase
          .from('wallets')
          .select('points')
          .eq('user_id', user.id)
          .single<WalletRow>()

        if (!alive) return

        if (w) {
          setPoints(Number(w.points))
        } else {
          // no row found => create one with 1000 points
          const { data: w2, error: insErr } = await supabase
            .from('wallets')
            .insert({ user_id: user.id, points: 1000 })
            .select('points')
            .single<WalletRow>()
          if (insErr) throw insErr
          setPoints(Number(w2?.points ?? 1000))
        }

        // positions
        const { data: pos, error: pErr } = await supabase
          .from('positions')
          .select('event_id, side, qty')
          .eq('user_id', user.id)
          .returns<PositionRow[]>()
        if (pErr) throw pErr

        setPositions(pos ?? [])

        const ids = (pos ?? []).map(p => p.event_id)
        if (!ids.length) {
          setEventsById({})
          setStateByEvent({})
          setLoading(false)
          return
        }

        // events
        const { data: evs, error: eErr } = await supabase
          .from('events')
          .select('id, title, status')
          .in('id', ids)
          .returns<EventRow[]>()
        if (eErr) throw eErr

        const evMap: Record<string, EventRow> = {}
        for (const e of evs ?? []) evMap[e.id] = e
        setEventsById(evMap)

        // state rows
        const { data: sts, error: sErr } = await supabase
          .from('lmsr_state')
          .select('event_id, b, q_yes, q_no')
          .in('event_id', ids)
          .returns<StateRow[]>()
        if (sErr) throw sErr

        const stMap: Record<string, StateRow> = {}
        for (const s of sts ?? []) stMap[s.event_id] = s
        setStateByEvent(stMap)
      } catch (e: any) {
        if (!alive) return
        setErr(e?.message ?? 'Failed to load profile')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  async function refreshAll() {
    // simple reload to re-run effect
    location.reload()
  }

  async function sendMagicLink() {
    setMsg(null)
    if (!email) { setMsg('Enter your email first'); return }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/me` },
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

  // ---------- RENDER ----------
  if (loading) return <div className="p-6">Loading…</div>

// Signed-out
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
        type="button"
        onClick={sendMagicLink}
        className="w-full rounded-lg py-2 font-medium bg-[#81E638] text-black hover:brightness-95"
      >
        Send magic link
      </button>

      {msg && (
        <p className="text-sm mt-3" style={{ color: 'rgb(129, 230, 56)' }}>
          {msg}
        </p>
      )}
    </div>
  )
}

  // Signed-in
  return (
    <div className="max-w-xl mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Account</h1>
        <button
          onClick={refreshAll}
          className="text-xs px-3 py-1 rounded-lg border border-okx-border hover:bg-neutral-800"
        >
          Refresh
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {err}
        </div>
      )}

      {/* Identity */}
      <div className="rounded-xl border border-okx-border p-4">
        <div className="text-sm text-neutral-400">Signed in as</div>
        <div className="text-lg break-all">{userEmail ?? userId}</div>
      </div>

      {/* Wallet */}
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

      {/* Positions */}
      <div className="rounded-xl border border-okx-border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Your Positions</div>
          <div className="text-sm text-neutral-400">Est. value: {totalValue}</div>
        </div>

        {!positions.length ? (
          <div className="text-sm text-neutral-400">No positions yet.</div>
        ) : (
          <ul className="space-y-2">
            {positions.map((p, i) => {
              const ev = eventsById[p.event_id]
              const st = stateByEvent[p.event_id]
              const pYes = yesPrice(st)
              const price = p.side === 'YES' ? pYes : (1 - pYes)
              const val = Math.round(Number(p.qty) * price * 100) / 100

              return (
                <li key={`${p.event_id}-${p.side}-${i}`} className="flex items-center justify-between rounded-lg border border-okx-border p-3">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{ev?.title ?? p.event_id}</div>
                    <div className="text-xs text-neutral-400">
                      {p.side} · qty {p.qty} · price {price.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-sm">{val}</div>
                </li>
              )
            })}
          </ul>
        )}
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
