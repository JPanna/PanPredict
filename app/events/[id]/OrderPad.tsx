'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0


import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Props = { eventId: string }

type Quote = {
  price_yes: number
  price_no: number
}

type RecentOrder = {
  created_at: string
  side: 'YES' | 'NO'
  qty: number
  cost_points: number | null
}

export default function OrderPad({ eventId }: Props) {
  const supabase = createClientComponentClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [qty, setQty] = useState<number>(1)
  const [placing, setPlacing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [quote, setQuote] = useState<Quote | null>(null)
  const [orders, setOrders] = useState<RecentOrder[]>([])

  // --- Data loaders ----------------------------------------------------------

  async function ensureWallet() {
    await supabase.rpc('ensure_wallet')
  }

  async function loadUserAndWallet() {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id ?? null)
    if (user?.id) {
      await ensureWallet()
      const { data } = await supabase
        .from('wallets')
        .select('points')
        .eq('user_id', user.id)
        .single()
      setPoints(data?.points ?? 0)
    } else {
      setPoints(null)
    }
  }

  async function refreshWallet() {
    if (!userId) return
    const { data } = await supabase
      .from('wallets')
      .select('points')
      .eq('user_id', userId)
      .single()
    setPoints(data?.points ?? 0)
  }

  async function loadQuote() {
    const { data, error } = await supabase.rpc('get_lmsr_quote', { p_event: eventId })
    if (error || !data) {
      setQuote(null)
      return
    }
    setQuote({
      price_yes: Number(data.price_yes),
      price_no: Number(data.price_no)
    })
  }

  async function loadOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, side, qty, cost_points')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (!error) setOrders((data as RecentOrder[]) ?? [])
  }

  // Initial load + polling for quote and recent orders
  useEffect(() => {
    let alive = true
    ;(async () => {
      await loadUserAndWallet()
      await loadQuote()
      await loadOrders()
      if (!alive) return
      const t = setInterval(() => {
        loadQuote()
        loadOrders()
      }, 5000)
      return () => clearInterval(t)
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // --- Trading ---------------------------------------------------------------

  async function place(side: 'YES'|'NO', mode: 'buy'|'sell') {
    setMsg(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setMsg('Please sign in to trade.'); return }

    if (!Number.isFinite(qty) || qty <= 0) { setMsg('Quantity must be at least 1.'); return }
    const signedQty = mode === 'buy' ? qty : -qty

    try {
      setPlacing(true)
      const { data, error } = await supabase.rpc('place_order_lmsr', {
        p_event: eventId,
        p_side: side,
        p_qty: signedQty
      })

      if (error) {
        setMsg(`Couldn’t place order. ${error.message}`)
        return
      }

      if (!data?.ok) {
        const reason = data?.error ?? 'Unknown error'
        const map: Record<string,string> = {
          SIGN_IN_REQUIRED: 'Please sign in to trade.',
          QTY_ZERO: 'Quantity must not be zero.',
          BAD_SIDE: 'Order side must be YES or NO.',
          EVENT_NOT_FOUND: 'This market no longer exists.',
          EVENT_LOCKED: 'This market is locked.',
          INSUFFICIENT_POINTS: 'Not enough points in your wallet.'
        }
        setMsg(map[reason] ?? `Couldn’t place order. ${reason}`)
        return
      }

      await Promise.all([refreshWallet(), loadQuote(), loadOrders()])
      setMsg(mode === 'buy' ? 'Order placed ✅' : 'Sold ✅')
    } catch (e:any) {
      setMsg(`Couldn’t place order. ${e?.message ?? ''}`.trim())
    } finally {
      setPlacing(false)
    }
  }

  const disabled = placing || !userId

  // --- UI --------------------------------------------------------------------

  return (
    <div className="rounded border border-neutral-800 bg-neutral-950 p-4">
      {/* Wallet + Live Prices */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="flex items-center justify-between col-span-1">
          <div>Wallet</div>
          <div className="font-medium">{points ?? '—'} pts</div>
        </div>
        <div className="text-center col-span-1">
          <div className="text-neutral-400">YES</div>
          <div className="text-lg font-semibold">
            {quote ? `${(quote.price_yes * 100).toFixed(1)}%` : '—'}
          </div>
        </div>
        <div className="text-center col-span-1">
          <div className="text-neutral-400">NO</div>
          <div className="text-lg font-semibold">
            {quote ? `${(quote.price_no * 100).toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>

      {!userId && (
        <div className="mb-3">
          <Link href="/auth" className="underline text-sm">Sign in</Link>
        </div>
      )}

      {/* Qty input */}
      <label className="block text-sm mb-1">Qty</label>
      <input
        type="number"
        min={1}
        value={qty}
        onChange={e => setQty(Math.max(1, Number(e.target.value)))}
        className="w-full rounded border border-neutral-700 bg-neutral-900 p-2 mb-4"
      />

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          disabled={disabled}
          onClick={() => place('YES','buy')}
          className="w-full rounded bg-[#1f2a10] text-[#a9e629] py-2 border border-[#2a3a18]"
        >
          {placing ? 'Placing…' : 'Buy YES'}
        </button>
        <button
          disabled={disabled}
          onClick={() => place('YES','sell')}
          className="w-full rounded bg-[#2a1022] text-[#f945a9] py-2 border border-[#3a1830]"
        >
          {placing ? 'Placing…' : 'Sell YES'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={disabled}
          onClick={() => place('NO','buy')}
          className="w-full rounded bg-[#1f2a10] text-[#a9e629] py-2 border border-[#2a3a18]"
        >
          {placing ? 'Placing…' : 'Buy NO'}
        </button>
        <button
          disabled={disabled}
          onClick={() => place('NO','sell')}
          className="w-full rounded bg-[#2a1022] text-[#f945a9] py-2 border border-[#3a1830]"
        >
          {placing ? 'Placing…' : 'Sell NO'}
        </button>
      </div>

      {msg && <p className="text-sm text-neutral-300 mt-3">{msg}</p>}

      {/* Recent trades */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-neutral-300">Recent trades</div>
          <button
            onClick={() => { loadQuote(); loadOrders() }}
            className="text-xs underline"
          >
            Refresh
          </button>
        </div>
        {orders.length === 0 ? (
          <div className="text-sm text-neutral-500">No trades yet</div>
        ) : (
          <div className="space-y-1 text-sm">
            {orders.map((o, i) => {
  const isCredit = Number(o.qty) < 0
  const label = isCredit ? 'Credit' : 'Cost'
  const amt = Math.abs(Number(o.cost_points ?? 0)).toFixed(2)
  return (
    <div key={i} className="flex items-center justify-between">
      <div className="w-24 text-neutral-400">
        {new Date(o.created_at).toLocaleTimeString()}
      </div>
      <div className="w-24">{o.side} {Number(o.qty)}</div>
      <div className="text-right flex-1">
        {label} {amt}
      </div>
    </div>
  )
})}
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-500 mt-3">Points only. No money.</p>
    </div>
  )
}
