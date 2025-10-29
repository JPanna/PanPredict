// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const envOk = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const supabase = getSupabaseServer()

  // Try to get the latest event
  let dbOk = false
  let rpcOk = false
  let eventId: string | null = null

  const { data: ev, error: evErr } = await supabase
    .from('events')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!evErr) {
    dbOk = true
    eventId = ev?.id ?? null
  }

  if (eventId) {
    const { data: quote, error: rpcErr } = await supabase.rpc('get_lmsr_quote', { p_event: eventId })
    rpcOk = Boolean(!rpcErr && quote)
  }

  return NextResponse.json({ ok: envOk && dbOk, envOk, dbOk, rpcOk, eventId }, { status: 200 })
}
