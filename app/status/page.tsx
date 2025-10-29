// app/status/page.tsx
'use client'
import { useEffect, useState } from 'react'

export default function StatusPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/health', { cache: 'no-store' })
      const j = await r.json()
      setData(j)
      setErr(null)
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Deployment status</h1>

      {loading && <p>Checking…</p>}
      {err && <p className="text-red-400">{err}</p>}

      {data && (
        <div className="space-y-2 text-sm">
          <div>Env vars: <b className={data.envOk ? 'text-green-400' : 'text-red-400'}>{String(data.envOk)}</b></div>
          <div>DB reachable: <b className={data.dbOk ? 'text-green-400' : 'text-red-400'}>{String(data.dbOk)}</b></div>
          <div>Quote RPC ok: <b className={data.rpcOk ? 'text-green-400' : 'text-yellow-400'}>{String(data.rpcOk)}</b></div>
          <div>Latest event id: <code className="text-neutral-300">{data.eventId ?? 'none'}</code></div>
        </div>
      )}
    </div>
  )
}
