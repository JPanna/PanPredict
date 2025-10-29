'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TradeButton from '../../components/TradeButton'

type Props = { eventId: string }

type WalletRow = { points: number }
type LmsrStateRow = { b: number; q_yes: number; q_no: number }

export default function OrderPad({ eventId }: Props) {
  const supabase = createClientComponentClient()

  const [qty, setQty] = useState<number>(1)
  const [msg, setMsg] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [state, setState] = useState<LmsrStateRow | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: w } = await supabase
          .from('wallets')
          .select('points')
          .eq('user_id', user.id)
          .single<WalletRow>()
        if (alive) setPoints(w?.points ?? null)
      }
      const { data: st } = await supabase
        .from('lmsr_state')
        .select('b,q_yes,q_no')
        .eq('event_id', eventId)
        .single<LmsrStateRow>()
      if (alive) setState(st ?? null)
    })()
    return () => {
      alive = false
    }
  }, [eventId])

  const priceYes = (() => {
    if (!state) return null
    const { b, q_yes, q_no } = state
    const ey = Math.exp(q_yes / (b || 1))
    const en = Math.exp(q_no / (b || 1))
    return ey / (ey + en)
  })()
  const priceNo = priceYes != null ? 1 - priceYes : null

  async function place(side: 'YES' | 'NO') {
    try {
      setMsg(null)
      setLoading(true)
      const { error } = await supabase.rpc('place_order_lmsr', {
        p_event: eventId,
        p_side: side,
        p_qty: Number(qty),
      })
      if (error) throw error
      // Optional: refresh points/state
      const [{ data: w }, { data: st }] = await Promise.all([
        supabase.from('wallets').select('points').eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '').single<WalletRow>(),
        supabase.from('lmsr_state').select('b,q_yes,q_no').eq('event_id', eventId).single<LmsrStateRow>(),
      ])
      setPoints(w?.points ?? points ?? null)
      setState(st ?? state)
    } catch (e: any) {
      setMsg(e.message ?? 'Order failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-okx-border p-4">
      <div className="text-sm text-neutral-400">Wallet</div>
      <div className="text-lg mb-3">{points != null ? `${points} pts` : '—'}</div>

      <div className="flex items-end gap-3 mb-3">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Qty</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-24 bg-transparent border border-okx-border rounded-lg px-3 py-2"
          />
        </div>

        {/* Small action pills using the same palette */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            Price <strong>YES</strong>:{' '}
            {priceYes != null ? `${(priceYes * 100).toFixed(1)}%` : '—'} ·{' '}
            <strong>NO</strong>:{' '}
            {priceNo != null ? `${(priceNo * 100).toFixed(1)}%` : '—'}
          </span>
          <button
            type="button"
            onClick={() => place('YES')}
            className="btn btn-buy px-3 py-1 text-sm"
            disabled={loading}
            title="Buy YES"
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => place('NO')}
            className="btn btn-sell px-3 py-1 text-sm"
            disabled={loading}
            title="Buy NO"
          >
            Sell
          </button>
        </div>
      </div>

      {/* Big primary buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TradeButton
          label={loading ? 'Placing…' : 'Buy YES'}
          kind="buy"
          onClick={() => place('YES')}
          disabled={loading}
          className="w-full"
        />
        <TradeButton
          label={loading ? 'Placing…' : 'Buy NO'}
          kind="sell"
          onClick={() => place('NO')}
          disabled={loading}
          className="w-full"
        />
      </div>

      {msg && <p className="text-sm text-red-400 mt-3">{msg}</p>}

      <p className="text-xs text-neutral-500 mt-2">Points only. No money.</p>
    </div>
  )
}
