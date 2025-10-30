'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type PositionRow = { event_id: string; side: 'YES' | 'NO'; qty: number }
type EventRow = { id: string; title: string; status: string }
type StateRow = { event_id: string; b: number; q_yes: number; q_no: number }

export default function PortfolioClient() {
  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [positions, setPositions] = useState<PositionRow[]>([])
  const [eventsById, setEventsById] = useState<Record<string, EventRow>>({})
  const [stateByEvent, setStateByEvent] = useState<Record<string, StateRow>>({})

  const yesPrice = (st?: StateRow): number => {
    if (!st) return 0.5
    const { b, q_yes, q_no } = st
    const ey = Math.exp((Number(q_yes) || 0) / (Number(b) || 1))
    const en = Math.exp((Number(q_no) || 0) / (Number(b) || 1))
    if (!isFinite(ey) || !isFinite(en)) return 0.5
    return ey / (ey + en)
  }

  const totalValue = useMemo(() => {
    if (!positions.length) return 0
    let sum = 0
    for (const p of positions) {
      const st = stateByEvent[p.event_id]
      const pYes = yesPrice(st)
      const price = p.side === 'YES' ? pYes : 1 - pYes
      sum += Number(p.qty) * price
    }
    return Math.round(sum * 100) / 100
  }, [positions, stateByEvent])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setErr(null)
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!alive) return

        if (!user) {
          setUserId(null)
          setPositions([])
          setEventsById({})
          setStateByEvent({})
          setLoading(false)
          return
        }
        setUserId(user.id)

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

        const { data: evs, error: eErr } = await supabase
          .from('events')
          .select('id, title, status')
          .in('id', ids)
          .returns<EventRow[]>()
        if (eErr) throw eErr
        const evMap: Record<string, EventRow> = {}
        for (const e of evs ?? []) evMap[e.id] = e
        setEventsById(evMap)

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
        setErr(e?.message ?? 'Failed to load portfolio')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <div className="p-6">Loading…</div>

  if (!userId) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-semibold mb-3">Portfolio</h1>
        <p className="text-sm text-neutral-400 mb-4">
          You’re signed out. Go to <Link href="/me" className="underline">/me</Link> to sign in.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Portfolio</h1>
        <div className="text-sm text-neutral-400">Est. total value: {totalValue}</div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {err}
        </div>
      )}

      {!positions.length ? (
        <div className="rounded-xl border border-okx-border p-4 text-sm text-neutral-400">
          No positions yet.
        </div>
      ) : (
        <div className="rounded-xl border border-okx-border p-4">
          <ul className="space-y-2">
            {positions.map((p, i) => {
              const ev = eventsById[p.event_id]
              const st = stateByEvent[p.event_id]
              const pYes = yesPrice(st)
              const price = p.side === 'YES' ? pYes : 1 - pYes
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
        </div>
      )}
    </div>
  )
}
