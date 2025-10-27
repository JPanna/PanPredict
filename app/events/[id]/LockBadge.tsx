'use client'
import { useEffect, useState } from 'react'

function fmt(ms: number) {
  if (ms <= 0) return 'Locked'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${r}s`
  return `${r}s`
}

export default function LockBadge({ lockTime, status }: { lockTime: string; status: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const ms = new Date(lockTime).getTime() - now
  const locked = status !== 'trading' || ms <= 0
  return (
    <span className={`text-xs px-2 py-1 rounded border ${locked ? 'bg-neutral-800 border-neutral-700' : 'bg-emerald-900/40 border-neutral-700'}`}>
      {locked ? 'Locked' : `Locks in ${fmt(ms)}`}
    </span>
  )
}
