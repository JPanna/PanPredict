'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function OrderPad({ eventId }: { eventId: string }) {
  const [side, setSide] = useState<'YES' | 'NO'>('YES')
  const [shares, setShares] = useState(10)
  const [lev, setLev] = useState<1 | 3>(1)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true); setMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in first')
      const { data, error } = await supabase.rpc('place_order_lmsr', {
        p_event: eventId,
        p_user: user.id,
        p_side: side,
        p_shares: shares,
        p_leverage: lev,
      })
      if (error) throw error
      setMsg(`Filled • New prob ${(Number(data?.price_after) * 100).toFixed(1)}%`)
    } catch (e: any) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setSide('YES')} className={`px-3 py-2 rounded ${side === 'YES' ? 'bg-green-600' : 'bg-neutral-800'}`}>YES</button>
        <button onClick={() => setSide('NO')}  className={`px-3 py-2 rounded ${side === 'NO'  ? 'bg-red-600'   : 'bg-neutral-800'}`}>NO</button>
      </div>
      <label className="text-sm">Shares</label>
      <input type="number" min={1} className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 mb-3"
             value={shares} onChange={(e) => setShares(Math.max(1, Number(e.target.value)))} />
      <label className="text-sm">Leverage</label>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setLev(1)} className={`px-3 py-2 rounded ${lev === 1 ? 'bg-indigo-600' : 'bg-neutral-800'}`}>1×</button>
        <button onClick={() => setLev(3)} className={`px-3 py-2 rounded ${lev === 3 ? 'bg-indigo-600' : 'bg-neutral-800'}`}>3×</button>
      </div>
      <button onClick={submit} disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded">
        {loading ? 'Placing…' : 'Place order'}
      </button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  )
}
