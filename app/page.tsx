'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Row = { id: string; title: string; status: string }

export default function Home() {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('id,title,status')
        .order('created_at', { ascending: false })
        .limit(50)
      setRows((data ?? []) as any)
    })()
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Markets</h1>

        {/* NEW: OKX-style Create button */}
        <Link href="/new" className="btn btn-create">
          Create
        </Link>
      </div>

      <div className="space-y-2">
        {rows.map((e) => (
          <Link
            key={e.id}
            href={`/events/${e.id}`}
            className="block rounded border border-okx-border bg-okx-surface p-3 hover:border-okx-sub"
          >
            <div className="flex justify-between">
              <span>{e.title}</span>
              <span className="text-xs text-neutral-500">{e.status}</span>
            </div>
          </Link>
        ))}
        {rows.length === 0 && <p className="text-neutral-400">No events yet.</p>}
      </div>
    </div>
  )
}
