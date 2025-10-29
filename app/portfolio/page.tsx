'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

type Position = {
  event_id: string
  side: 'YES'|'NO'
  qty: number
  event_title: string
  lock_time: string
}

type LmsrState = { event_id: string; b: number; q_yes: number; q_no: number }

const supabase = createClientComponentClient()

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState<number | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [states, setStates] = useState<Record<string, LmsrState>>({})
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setErr(null)

        // me
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setErr('Please sign in'); setLoading(false); return
        }

        // wallet
        {
          const { data: w } = await supabase
            .from('wallets').select('points').eq('user_id', user.id).maybeSingle()
          setPoints(w?.points ?? 1000) // default until first trade
        }

        // positions + event titles
        const { data: pos } = await supabase
          .from('positions')
          .select(`
            event_id,
            side,
            qty,
            events!inner ( title, lock_time )
          `)
          .eq('user_id', user.id)

        const rows: Position[] = (pos ?? []).map((r:any) => ({
          event_id: r.event_id,
          side: r.side,
          qty: Number(r.qty),
          event_title: r.events?.title ?? '',
          lock_time: r.events?.lock_time ?? '',
        }))

        setPositions(rows)

        // load lmsr_state for all those events
        const ids = Array.from(new Set(rows.map(r => r.event_id)))
        if (ids.length) {
          const { data: st } = await supabase
            .from('lmsr_state')
            .select('*')
            .in('event_id', ids)
          const map: Record<string, LmsrState> = {}
          for (const s of (st ?? [])) map[s.event_id] = s as LmsrState
          setStates(map)
        }
      } catch (e:any) {
        setErr(e.message ?? 'Failed to load portfolio')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // compute value using current prices
  function priceYes(st?: LmsrState): number {
    if (!st) return 0.5
    const b = Number(st.b || 200)
    const ey = Math.exp(Number(st.q_yes)/b)
    const en = Math.exp(Number(st.q_no)/b)
    return ey / (ey + en)
  }

  const rows = useMemo(() => {
    return positions.map(p => {
      const st = states[p.event_id]
      const py = priceYes(st)
      const price = p.side === 'YES' ? py : 1 - py
      const value = Number(p.qty) * price
      return { ...p, price, value }
    })
  }, [positions, states])

  const posValue = rows.reduce((s,r)=> s + r.value, 0)
  const total = (points ?? 0) + posValue

  if (loading) return <div className="p-6">Loading…</div>
  if (err) return <div className="p-6 text-red-400">{err}</div>

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Portfolio</h1>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 rounded-xl bg-neutral-900 border border-okx-border">
          <div className="text-xs text-neutral-400">Wallet points</div>
          <div className="text-lg">{points ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-neutral-900 border border-okx-border">
          <div className="text-xs text-neutral-400">Positions value (est.)</div>
          <div className="text-lg">{posValue.toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-xl bg-neutral-900 border border-okx-border">
          <div className="text-xs text-neutral-400">Total (pts)</div>
          <div className="text-lg">{total.toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-okx-border overflow-hidden">
        <div className="px-4 py-2 text-xs text-neutral-400 bg-neutral-950 border-b border-okx-border">
          Open positions
        </div>
        <div className="divide-y divide-okx-border">
          {rows.length === 0 && (
            <div className="px-4 py-4 text-neutral-500">No positions yet.</div>
          )}
          {rows.map((r, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4 text-sm">
              <div className="flex-1 min-w-0">
                <div className="truncate">
                  <Link className="text-neutral-200 hover:underline" href={`/events/${r.event_id}`}>
                    {r.event_title}
                  </Link>
                </div>
                <div className="text-xs text-neutral-500">
                  {new Date(r.lock_time).toLocaleString()}
                </div>
              </div>
              <div className="w-20 text-right">{r.side}</div>
              <div className="w-20 text-right">{r.qty}</div>
              <div className="w-24 text-right">{(r.price*100).toFixed(1)}%</div>
              <div className="w-24 text-right">{r.value.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
