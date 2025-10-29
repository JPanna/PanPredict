'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthStatus() {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!alive) return
      setEmail(user?.email ?? null)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  if (loading) return null

  if (!email) {
    // Signed-out: show a subtle link, not a big “Please sign in”
    return (
      <Link href="/me" className="text-sm text-okx-sub hover:text-white">
        Sign in
      </Link>
    )
  }

  // Signed-in
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{email}</span>
      <button
        onClick={async () => { await supabase.auth.signOut(); location.reload() }}
        className="text-xs border border-okx-border rounded px-2 py-1 hover:bg-neutral-800"
      >
        Sign out
      </button>
    </div>
  )
}
