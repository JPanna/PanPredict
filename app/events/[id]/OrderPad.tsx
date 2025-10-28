'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Props = { eventId: string }

type LmsrStateRow = { event_id: string; b: number; q_yes: number; q_no: number }
type PositionRow  = { side: 'YES' | 'NO'; qty: number }

const supabase = createClientComponentClient()

export default function OrderPad({ eventId }: Props) {
  const [qty, setQty] = useState<number>(1)
  const [mode, setMode] = useState<'buy'|'sell'>('buy')
  const [msg, setMsg] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)

  const [points, setPoints] = useState<number | null>(null)
  const [state, setState] = useState<LmsrStateRow | null>(null)
  const [posYes, setPosYes] = useState<number>(0)
  const [posNo,  setPosNo ] = useState<number>(0)

  // load wallet, lmsr state, and my position
  useEffect(() => {
    let alive = true
    ;(async () => {
      // wallet
      {
        const { data: { user } } = await supabase.auth.getUser()
        if (!alive) return
        if (!user) { setPoints(null) } else {
          const { data: w } = await supabase
            .from('wallets')
            .select('points')
            .eq('user_id', user.id)
            .maybeSingle()
          // if null the RPC will create one, but treat as 1000 for pre-check UI
          setPoints(w?.points ?? 1000)
        }
      }
      // state
      {
        const { data: st } = await supabase
          .from('lmsr_state')
          .select('*')
          .eq('event_id', eventId)
          .single<LmsrStateRow>()
        if (!alive) return
        setState(st ?? null)
      }
      // my position
      {
        const { data: ps } = await supabase
          .from('positions')
          .select('side, qty')
          .eq('event_id', eventId)
        if (!alive) return
        const yes = (ps ?? []).find(p => p.side === 'YES')?.qty ?? 0
        const no  = (ps ?? []).find(p => p.side === 'NO')?.qty  ?? 0
        setPosYes(Number(yes))
        setPosNo(Number(no))
      }
    })()
    return () => { alive = false }
  }, [eventId])

  // LMSR price/cost helpers (binary)
  const b   = Number(state?.b ?? 200)
  const qy0 = Number(state?.q_yes ?? 0)
  const qn0 = Number(state?.q_no  ?? 0)

  const priceYes = useMemo(() => {
    const ey = Math.exp(qy0 / b)
    const en = Math.exp(qn0 / b)
    return ey / (ey + en)
  }, [qy0, qn0, b])

  const priceNo = 1 - priceYes

  function quoteCost(side: 'YES'|'NO', q: number): number {
    // cost = C(q') - C(q), C(q) = b * ln(exp(qy/b) + exp(qn/b))
    const ey0 = Math.exp(qy0 / b)
    const en0 = Math.exp(qn0 / b)
    const c0  = b * Math.log(ey0 + en0)

    const qy1 = side === 'YES' ? qy0 + q : qy0
    const qn1 = side === 'NO'  ? qn0 + q : qn0
    const ey1 = Math.exp(qy1 / b)
    const en1 = Math.exp(qn1 / b)
    const c1  = b * Math.log(ey1 + en1)

    return c1 - c0
  }

  const buyYesCost = useMemo(() => quoteCost('YES', Math.max(0, qty)), [qty, qy0, qn0, b])
  const buyNoCost  = useMemo(() => quoteCost('NO',  Math.max(0, qty)), [qty, qy0, qn0, b])

  const canBuyYes = points == null ? true : points >= buyYesCost
  const canBuyNo  = points == null ? true : points >= buyNoCost

  const canSellYes = posYes >= qty
  const canSellNo  = posNo  >= qty

  async function place(side: 'YES'|'NO') {
    setMsg(null)
    setPlacing(true)
    try {
      const signedQty = mode === 'buy' ? qty : -qty
      const { data, error } = await supabase.rpc('place_order_lmsr', {
        p_event: eventId,
        p_side: side,
        p_qty: Number(signedQty),
      })
      if (error) throw error

      // refresh wallet + position quickly
      const { data: w } = await supabase
        .from('wallets').select('points')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .maybeSingle()
      setPoints(w?.points ?? data?.new_points ?? points)

      // re-pull my positions
      const { data: ps } = await supabase
        .from('positions')
        .select('side, qty')
        .eq('event_id', eventId)
      const yes = (ps ?? []).find(p => p.side === 'YES')?.qty ?? 0
      const no  = (ps ?? []).find(p => p.side === 'NO')?.qty  ?? 0
      setPosYes(Number(yes))
      setPosNo(Number(no))

      setMsg('Order placed')
    } catch (e:any) {
      setMsg(e.message ?? 'Order failed')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="bg-neutral-900 border border-okx-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-400">
          Wallet: <span className="text-neutral-200">{points ?? '—'} pts</span>
        </div>
        <div className="text-xs">
          Price YES: {(priceYes*100).toFixed(1)}% &nbsp;·&nbsp; NO:{' '}
          {(priceNo*100).toFixed(1)}%
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <label className="text-sm text-neutral-400">Qty</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e)=>setQty(Math.max(1, Number(e.target.value)))}
          className="w-24 bg-transparent border border-okx-border rounded-lg px-3 py-2"
        />
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button
            className={`px-2 py-1 rounded border ${mode==='buy' ? 'border-indigo-400 text-indigo-300' : 'border-okx-border text-neutral-300'}`}
            onClick={()=>setMode('buy')}
          >
            Buy
          </button>
          <button
            className={`px-2 py-1 rounded border ${mode==='sell' ? 'border-indigo-400 text-indigo-300' : 'border-okx-border text-neutral-300'}`}
            onClick={()=>setMode('sell')}
          >
            Sell
          </button>
        </div>
      </div>

      {/* my position */}
      <div className="mt-2 text-xs text-neutral-400">
        Your position — YES: <span className="text-neutral-200">{posYes}</span>
        {' · '}
        NO: <span className="text-neutral-200">{posNo}</span>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          disabled={placing || (mode==='buy' && !canBuyYes) || (mode==='sell' && !canSellYes)}
          onClick={()=>place('YES')}
          className="rounded-lg px-3 py-2 bg-indigo-600 disabled:bg-neutral-700"
        >
          {mode==='buy' ? 'Buy' : 'Sell'} YES
          {mode==='buy' && points!=null && (
            <span className="ml-2 text-xs opacity-70">({buyYesCost.toFixed(2)} pts)</span>
          )}
        </button>

        <button
          disabled={placing || (mode==='buy' && !canBuyNo) || (mode==='sell' && !canSellNo)}
          onClick={()=>place('NO')}
          className="rounded-lg px-3 py-2 bg-indigo-600 disabled:bg-neutral-700"
        >
          {mode==='buy' ? 'Buy' : 'Sell'} NO
          {mode==='buy' && points!=null && (
            <span className="ml-2 text-xs opacity-70">({buyNoCost.toFixed(2)} pts)</span>
          )}
        </button>
      </div>

      {msg && <p className="text-xs text-neutral-300 mt-3">{msg}</p>}
      <p className="text-xs text-neutral-500 mt-2">Points only. No money.</p>
    </div>
  )
}
