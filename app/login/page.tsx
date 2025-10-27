'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-3">Sign in</h1>
      {sent ? (
        <p>Check your email for a magic link.</p>
      ) : (
        <>
          <input
            type="email"
            className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={send}
            className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded"
          >
            Send magic link
          </button>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </>
      )}
    </div>
  )
}
