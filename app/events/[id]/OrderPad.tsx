'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type WalletRow = { points: number }
type Props = { eventId: string }

export default function OrderPad({ eventId }: Props) {
  const supabase = createClientComponentClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [qty, setQty] = useState<number>(1)
  const [placing, setPlacing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Load user + wallet
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!alive) return
      setUserId(user?.id ?? null)

      if (user?.id) {
        const { data: w } = await supabase
          .from('wallets')
          .select('points')
          .eq('user_id', user.id)
          .single<WalletRow>()
        if (!alive) return
        setPoints(w?.points ?? null)
      } else {
        setPoints(null)
      }
    })()
    return () => { alive = false }
  }, [])

  async function refreshWallet() {
    if (!userId) return
    const { data: w } = await supabase
      .from('wallets')
      .select('points')
      .eq('user_id', userId)
      .single<WalletRow>()
    setPoints(w?.points ?? null)
  }

  async function place(side: 'YES' | 'NO', mode: 'buy' | 'sell') {
    setMsg(null)

    if (!userId) { setMsg('Please sign in to trade.'); return }
    if (!qty || qty <= 0) { setMsg('Enter a quantity greater than 0.'); return }

    const signedQty = mode === 'buy' ? Number(qty) : -Number(qty)

    try {
      setPlacing(true)
      const { error } = await supabase.rpc('place_order_lmsr', {
        p_event: eventId,
        p_side: side,
        p_qty: signedQty,          // positive = buy, negative = sell back
      })
      if (error) {
        const m = (error.message || '').toUpperCase()
        if (m.includes('SIGN_IN_REQUIRED')) setMsg('Please sign in to trade.')
        else if (m.includes('INSUFFICIENT_POINTS')) setMsg('Not enough points in your wallet.')
        else setMsg('Couldn’t place order. Please try again.')
        return
      }
      await refreshWallet()
      setMsg(mode === 'buy' ? 'Order placed ✅' : 'Sold ✅')
    } catch {
      setMsg('Couldn’t place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const disabled = placing || !userId

  return (
    <div className="rounded-xl border border-okx-border p-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <div>
          <span className="text-neutral-400">Wallet</span>{' '}
          <span className="font-medium">{points ?? '—'} pts</span>
        </div>

        {!userId && (
          <Link href="/me" className="underline text-okx-sub">
            Sign in to get 1000 pts
          </Link>
        )}
      </div>

      <label className="block text-sm text-neutral-400 mb-1">Qty</label>
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e)=>setQty(Number(e.target.value))}
        className="w-24 bg-transparent border border-okx-border rounded-lg px-3 py-2 mb-4"
      />

      {/* Two columns: YES and NO; each has BUY and SELL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* YES side */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={()=>place('YES','buy')}
            className="btn btn-buy w-full"
          >
            {placing ? 'Placing…' : 'Buy YES'}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={()=>place('YES','sell')}
            className="btn btn-sell w-full"
          >
            {placing ? 'Placing…' : 'Sell YES'}
          </button>
        </div>

        {/* NO side */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={()=>place('NO','buy')}
            className="btn btn-buy w-full"
          >
            {placing ? 'Placing…' : 'Buy NO'}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={()=>place('NO','sell')}
            className="btn btn-sell w-full"
          >
            {placing ? 'Placing…' : 'Sell NO'}
          </button>
        </div>
      </div>

      {msg && <p className="text-sm mt-3 text-red-400">{msg}</p>}

      <p className="text-xs text-neutral-500 mt-2">
        Points only. No money.
      </p>
    </div>
  )
}
