'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// pretty text for the lock slider (minutes → human)
function fmtLock(m: number) {
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (m < 60) return `${m}m`
  if (h < 24) return `${h}h${m % 60 ? ` ${m % 60}m` : ''}`
  return `${d}d${h % 24 ? ` ${h % 24}h` : ''}`
}

// local "now" in YYYY-MM-DDTHH:mm for <input type="datetime-local">
function nowLocalIso() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function NewEvent() {
  const r = useRouter()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [resolveLocal, setResolveLocal] = useState('')
  const [lock, setLock] = useState(2880) // default 2 days (in minutes)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function create() {
    setMsg(null)
    setLoading(true)
    try {
      // must be signed in
      const { data: { user }, error: uerr } = await supabase.auth.getUser()
      if (uerr || !user) throw new Error('Please sign in first')

      // ensure a profile row exists (in case trigger ran after your signup)
      await supabase.from('profiles').upsert({
        id: user.id,
        handle: (user.email ?? 'user').split('@')[0],
      })

      // resolve time
      if (!resolveLocal) throw new Error('Pick a resolve time')
      const resolveDate = new Date(resolveLocal)
      if (Number.isNaN(resolveDate.getTime())) throw new Error('Pick a valid resolve time')

      // lock window (1 minute → 1 month)
      const minutes = Math.max(1, Math.min(43200, Math.floor(lock)))
      const lockDate = new Date(resolveDate.getTime() - minutes * 60 * 1000)

      // create event
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          title,
          description: desc || null,
          lock_time: lockDate.toISOString(),
          resolve_time: resolveDate.toISOString(),
          resolver_id: user.id,
          status: 'trading',
        })
        .select()
        .single()
      if (error) throw error

      // init LMSR state
      const { error: e2 } = await supabase
        .from('lmsr_state')
        .insert({ event_id: event.id, b: 200 })
      if (e2) throw e2

      // go to market
      r.push(`/events/${event.id}`)
    } catch (e: any) {
      setMsg(e.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create event</h1>

      <input
        className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 mb-3"
        placeholder="Will Team X win?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 mb-3"
        rows={3}
        placeholder="Resolution criteria…"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <label className="block text-sm mb-1">Resolve time</label>
      <input
        type="datetime-local"
        step="60"
        min={nowLocalIso()}
        className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 mb-4"
        value={resolveLocal}
        onChange={(e) => setResolveLocal(e.target.value)}
      />

      <div className="flex justify-between text-sm">
        <span>Lock before resolve</span>
        <span className="text-neutral-400">{fmtLock(lock)}</span>
      </div>
      <input
        type="range"
        min={1}
        max={43200}
        step={1}
        value={lock}
        onChange={(e) => setLock(Number(e.target.value))}
        className="w-full mb-4 accent-indigo-500"
      />

      <button
        disabled={!title || !resolveLocal || loading}
        onClick={create}
        className="w-full bg-indigo-600 text-white py-2 rounded"
      >
        {loading ? 'Creating…' : 'Create'}
      </button>

      {msg && <p className="mt-2 text-red-400 text-sm">{msg}</p>}
    </div>
  )
}
