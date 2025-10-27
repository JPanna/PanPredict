'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user?.email ?? null)
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signOut() { await supabase.auth.signOut(); location.reload() }

  return email ? (
    <div className="text-sm flex items-center gap-2">
      <span>{email}</span>
      <button onClick={signOut} className="px-2 py-1 bg-neutral-800 rounded">Sign out</button>
    </div>
  ) : (
    <a className="px-2 py-1 bg-indigo-600 text-white rounded" href="/login">Sign in</a>
  )
}
