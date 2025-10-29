'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function MarketPanel({ eventId }: { eventId: string }) {
  const supabase = createClientComponentClient()
  const [quote, setQuote] = useState<{price_yes:number, price_no:number} | null>(null)
  const [orders, setOrders] = useState<any[]>([])

  async function loadQuote() {
    const { data, error } = await supabase.rpc('get_lmsr_quote', { p_event: eventId })
    if (!error && data) {
      setQuote({ price_yes: Number(data.price_yes), price_no: Number(data.price_no) })
    }
  }

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('created_at, side, qty, cost_points')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(10)
    setOrders(data || [])
  }

  useEffect(() => {
    loadQuote()
    loadOrders()
    // simple poll every 5s
    const t = setInterval(() => { loadQuote(); loadOrders() }, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="rounded border border-neutral-800 bg-neutral-950 p-4 mt-4">
      <h3 className="text-sm font-semibold mb-3">Market</h3>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <div className="text-neutral-400">YES price</div>
          <div className="text-lg font-semibold">
            {quote ? (quote.price_yes*100).toFixed(1) + '%' : '—'}
          </div>
        </div>
        <div>
          <div className="text-neutral-400">NO price</div>
          <div className="text-lg font-semibold">
            {quote ? (quote.price_no*100).toFixed(1) + '%' : '—'}
          </div>
        </div>
      </div>

      <div className="text-sm text-neutral-300 mb-2">Recent trades</div>
      <div className="space-y-1 text-sm">
        {orders.length === 0 && <div className="text-neutral-500">No trades yet</div>}
        {orders.map((o, i) => (
          <div key={i} className="flex justify-between">
            <div>{new Date(o.created_at).toLocaleTimeString()}</div>
            <div>{o.side} {Number(o.qty)}</div>
            <div>{o.cost_points >= 0 ? 'Cost' : 'Credit'} {Math.abs(Number(o.cost_points)).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
