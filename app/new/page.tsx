'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type MarketType = 'binary' | 'over_under' | 'moneyline'

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [type, setType] = useState<MarketType>('binary')
  const [threshold, setThreshold] = useState<string>('') // only for over_under
  const [resolveLocal, setResolveLocal] = useState('')   // yyyy-MM-ddTHH:mm
  const [lockLocal, setLockLocal] = useState('')         // yyyy-MM-ddTHH:mm
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function toIso(local: string) {
    if (!local) return null
    const d = new Date(local)
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString()
  }

  async function createEvent() {
    setMsg(null)

    if (!title.trim()) { setMsg('Please add a title.'); return }
    const resolveIso = toIso(resolveLocal)
    const lockIso = toIso(lockLocal)
    if (!resolveIso) { setMsg('Please pick a resolve time.'); return }
    if (!lockIso) { setMsg('Please pick a lock time.'); return }

    setLoading(true)
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw userErr
      if (!user) { setMsg('Please sign in to create an event.'); return }

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: title.trim(),
          description: desc.trim(),
          market_type: type,                               // ok if you have the column
          threshold: type === 'over_under' && threshold !== '' ? Number(threshold) : null,
          resolve_time: resolveIso,
          lock_time: lockIso,
          status: 'trading',
          created_by: user.id,
          resolver_id: user.id                             // key fix: set default resolver
        })
        .select('id')
        .single()

      if (error) {
        const m = (error.message || '').toLowerCase()
        if (m.includes('resolver_id')) {
          setMsg('Resolver is missing. I set it to you by default. If this still appears, run the SQL patch below.')
        } else {
          setMsg('Couldn’t create the event. Please try again.')
        }
        return
      }

      router.push(`/events/${data.id}`)
    } catch {
      setMsg('Couldn’t create the event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Create event</h1>

      <label className="block text-sm mb-1">Title</label>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full rounded border border-neutral-700 bg-neutral-900 p-2 mb-3"
        placeholder="AxB"
      />

      <label className="block text-sm mb-1">Description</label>
      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        className="w-full rounded border border-neutral-700 bg-neutral-900 p-2 mb-3"
        rows={4}
        placeholder="A join B"
      />

      <label className="block text-sm mb-1">Market type</label>
      <select
        value={type}
        onChange={e => setType(e.target.value as MarketType)}
        className="w-full rounded border border-neutral-700 bg-neutral-900 p-2 mb-3"
      >
        <option value="binary">Yes / No</option>
        <option value="over_under">Over / Under</option>
        <option value="moneyline">Moneyline</option>
      </select>

      {type === 'over_under' && (
        <>
          <label className="block text-sm mb-1">Threshold</label>
          <input
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
            className="w-full rounded border border-neutral-700 bg-neutral-900 p-2 mb-3"
            placeholder="Enter a number"
          />
        </>
      )}

      <label className="block text-sm mb-1">Resolve time</label>
      <input
        type="datetime-local"
        value={resolveLocal}
        onChange={e => setResolveLocal(e.target.value)}
        className="w-full rounded border border-neutral-700 bg-neutral-900 p-2 mb-3"
      />

      <label className="block text-sm mb-1">Lock time</label>
      <input
        type="datetime-local"
        value={lockLocal}
        onChange={e => setLockLocal(e.target.value)}
        className="w-full rounded border border-neutral-700 bg-neutral-900 p-2 mb-4"
      />

      <button
        type="button"
        onClick={createEvent}
        className="w-full rounded bg-[#1f2a10] text-[#a9e629] py-2 border border-[#2a3a18]"
        disabled={loading}
      >
        {loading ? 'Creating…' : 'Create'}
      </button>

      {msg && <p className="text-sm text-neutral-300 mt-3">{msg}</p>}
    </div>
  )
}
