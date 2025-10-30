'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Local siblings (ensure these exist)
import ProbChart from './ProbChart'
import OrderPad from './OrderPad'
import LockBadge from './LockBadge'

// ---------- Types ----------
type EventRow = {
  id: string
  title: string
  description: string | null
  status: string
  lock_time: string
  resolve_time: string
  created_at: string
  created_by: string         // ⭐ needed to gate Delete
  resolver_id?: string | null
}

type OrderRow = {
  id: string
  event_id: string
  side: 'YES' | 'NO'
  price_after?: number | null
  created_at: string
}

type LmsrStateRow = {
  event_id: string
  b: number
  q_yes: number
  q_no: number
}

// One Supabase client for this file
const supabase = createClientComponentClient()

export default function EventPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<EventRow | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [state, setState] = useState<LmsrStateRow | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // ---- current user/admin info for gating ----
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!alive) return
      setUserId(user?.id ?? null)

      if (user?.id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        if (!alive) return
        setIsAdmin(!!prof?.is_admin)
      }
    })()
    return () => { alive = false }
  }, [])

  const canDelete = !!userId && !!event && (userId === event.created_by || isAdmin)

  // ----- Load event + orders + state -----
  useEffect(() => {
    if (!id) return
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setErr(null)

        const [{ data: ev, error: e1 }, { data: st, error: e2 }] =
          await Promise.all([
            supabase.from('events').select('*').eq('id', id).single<EventRow>(),
            supabase.from('lmsr_state').select('*').eq('event_id', id).single<LmsrStateRow>(),
          ])
        if (e1) throw e1
        if (e2 && e2.code !== 'PGRST116') {
          // ignore "row not found" for brand-new markets
          throw e2
        }

        const { data: ords, error: e3 } = await supabase
          .from('orders')
          .select('*')
          .eq('event_id', id)
          .order('created_at', { ascending: true })
          .returns<OrderRow[]>()

        if (e3) throw e3

        if (!alive) return
        setEvent(ev ?? null)
        setState(st ?? null)
        setOrders(ords ?? [])
      } catch (e: any) {
        if (!alive) return
        setErr(e?.message ?? 'Failed to load event')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [id])

  // ----- chart series (0..1 prob) -----
  type ChartPoint = { ts: number; p: number };

  const series: ChartPoint[] = useMemo(() => {
    if (!orders) return [];

    // Build points from orders; use numeric timestamp so the chart can parse reliably
    const out: ChartPoint[] = orders
      .filter((o: any) => o?.created_at)
      .map((o: any) => ({
        ts: new Date(o.created_at).getTime(),      // <— numeric timestamp
        p: Number(o.price_after),                  // 0..1
      }))
      .sort((a, b) => a.ts - b.ts);

    // If there are no orders yet, seed a baseline point from current LMSR state
    if (out.length === 0 && event && state) {
      const b = Number(state.b);
      const qy = Number(state.q_yes);
      const qn = Number(state.q_no);
      const p0 = Math.exp((qy - qn) / (b || 1)) / (1 + Math.exp((qy - qn) / (b || 1)));
      out.push({ ts: new Date(event.created_at).getTime(), p: p0 });
    }

    return out;
  }, [orders, event, state]);

  // ----- delete handler -----
  async function onDelete() {
    if (!event || !canDelete) return
    const ok = window.confirm('Delete this event?')
    if (!ok) return
    const { error } = await supabase.from('events').delete().eq('id', event.id)
    if (error) {
      alert(error.message)
      return
    }
    router.push('/')
  }

  if (loading) return <div className="p-6">Loading…</div>
  if (err) return <div className="p-6 text-red-400">Error: {err}</div>
  if (!event) return <div className="p-6">Not found.</div>

  const locked = new Date(event.lock_time) <= new Date()

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          {event.description && (
            <p className="text-sm text-neutral-400 mt-1">{event.description}</p>
          )}
          <div className="text-xs text-neutral-500 mt-2 flex items-center gap-3">
            <LockBadge lockTime={event.lock_time} status={event.status} />
            <span>Status: <span className="text-neutral-300">{event.status}</span></span>
            <span>
              Resolves:{' '}
              <span className="text-neutral-300">
                {new Date(event.resolve_time).toLocaleString()}
              </span>
            </span>
          </div>
        </div>

        {/* Delete (only owner/admin) */}
        {canDelete && (
          <button
            onClick={onDelete}
            className="text-sm text-red-400 border border-okx-border px-3 py-2 rounded-lg hover:bg-red-500/10"
            title="Delete this event"
          >
            Delete event
          </button>
        )}
      </div>

      {/* Chart */}
      <div className="mt-6">
        <ProbChart data={series} />
      </div>

      {/* Info / market state */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 rounded-xl bg-neutral-900 border border-okx-border">
          <div className="text-xs text-neutral-400">B (liquidity)</div>
          <div className="text-lg">{state?.b ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-neutral-900 border border-okx-border">
          <div className="text-xs text-neutral-400">YES qty</div>
          <div className="text-lg">{state?.q_yes ?? '—'}</div>
        </div>
        <div className="p-3 rounded-xl bg-neutral-900 border border-okx-border">
          <div className="text-xs text-neutral-400">NO qty</div>
          <div className="text-lg">{state?.q_no ?? '—'}</div>
        </div>
      </div>

      {/* Order pad */}
      <div className="mt-6">
        {locked ? (
          <div className="rounded-xl border border-okx-border p-4 text-neutral-400">
            Trading locked.
          </div>
        ) : (
          <OrderPad eventId={id} />
          // if your OrderPad expects event_id, use: <OrderPad event_id={id} />
        )}
        <p className="text-xs text-neutral-500 mt-2">Points only. No money.</p>
      </div>
    </div>
  )
}
