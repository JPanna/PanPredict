'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type MarketType = 'binary' | 'over_under' | 'moneyline'

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState<string>('')
  const [resolveLocal, setResolveLocal] = useState<string>('')  // yyyy-MM-ddTHH:mm
  const [lockLocal, setLockLocal] = useState<string>('')        // yyyy-MM-ddTHH:mm
  const [type, setType] = useState<MarketType>('binary')
  const [threshold, setThreshold] = useState<number | ''>('')

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function toIso(local: string) {
    // local from <input type="datetime-local"> is local time; convert to ISO UTC string
    if (!local) return null
    const d = new Date(local)
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString()
  }

  async function createEvent() {
    setMsg(null)
    if (!title.trim()) { setMsg('Title is required'); return }
    const resolveIso = toIso(resolveLocal)
    const lockIso    = toIso(lockLocal)
    if (!resolveIso || !lockIso) { setMsg('Pick both resolve and lock time'); return }
    if (new Date(lockIso) >= new Date(resolveIso)) {
      setMsg('Lock time must be before resolve time')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in first')

      // Insert the event and RETURN its id so we can redirect
      const { data: ev, error } = await supabase
        .from('events')
        .insert({
          title: title.trim(),
          description: desc.trim() || null,
          resolve_time: resolveIso,
          lock_time   : lockIso,
          status      : 'trading',
          created_by  : user.id,                          // ⭐ IMPORTANT
          // You can comment these two out if you haven’t added the columns yet
          market_type : type,                              // 'binary' | 'over_under' | 'moneyline'
          threshold   : type === 'over_under' && threshold !== '' ? Number(threshold) : null,
        })
        .select('id')
        .single()

      if (error) throw error

      // For now we rely on the SQL seed to create YES/NO choices for binary markets.
      // If you later add Over/Under or Moneyline choices, you can insert them here.

      setMsg('Event created')
      router.push(`/events/${ev.id}`)
    } catch (e: any) {
      setMsg(e.message ?? 'Create failed')
    } finally {
      setLoading(false)
    }
  }

  const nowFloor = new Date(Date.now() - new Date().getTimezoneOffset()*60000)
    .toISOString().slice(0,16)

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Create event</h1>

      <input
        className="w-full p-2 rounded bg-neutral-900 border border-okx-border mb-3"
        placeholder="Will Team X win?"
        value={title}
        onChange={e=>setTitle(e.target.value)}
      />

      <textarea
        className="w-full p-2 rounded bg-neutral-900 border border-okx-border mb-3"
        rows={3}
        placeholder="Resolution criteria…"
        value={desc}
        onChange={e=>setDesc(e.target.value)}
      />

      {/* Optional: market type + threshold (safe to keep; defaults to binary) */}
      <label className="block text-sm text-neutral-400 mb-1">Market type</label>
      <select
        className="w-full p-2 rounded bg-neutral-900 border border-okx-border mb-3"
        value={type}
        onChange={e=>setType(e.target.value as MarketType)}
      >
        <option value="binary">Yes / No</option>
        <option value="over_under">Over / Under</option>
        <option value="moneyline">Moneyline (2–3 outcomes)</option>
      </select>

      {type === 'over_under' && (
        <input
          type="number"
          className="w-full p-2 rounded bg-neutral-900 border border-okx-border mb-3"
          placeholder="Threshold (e.g., 2.5 goals)"
          value={threshold}
          onChange={e=>setThreshold(e.target.value === '' ? '' : Number(e.target.value))}
        />
      )}

      <label className="block text-sm text-neutral-400 mb-1">Resolve time</label>
      <input
        type="datetime-local"
        min={nowFloor}
        className="w-full p-2 rounded bg-neutral-900 border border-okx-border mb-3"
        value={resolveLocal}
        onChange={e=>setResolveLocal(e.target.value)}
      />

      <label className="block text-sm text-neutral-400 mb-1">Lock time</label>
      <input
        type="datetime-local"
        min={nowFloor}
        className="w-full p-2 rounded bg-neutral-900 border border-okx-border mb-4"
        value={lockLocal}
        onChange={e=>setLockLocal(e.target.value)}
      />

      <button
  type="button"
  onClick={createEvent}   // keep your handler
  className="btn btn-create w-full"
  disabled={loading}
>
  {loading ? 'Creating…' : 'Create'}
</button>

      {msg && <p className="text-sm text-neutral-300 mt-3">{msg}</p>}
    </div>
  )
}
