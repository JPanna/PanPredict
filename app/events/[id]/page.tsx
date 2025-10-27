'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ProbChart from './ProbChart'
import OrderPad from './OrderPad'
import LockBadge from './LockBadge'

type Event = { id:string; title:string; description:string|null; lock_time:string; resolve_time:string; status:string; created_at:string }
type State = { b:number; q_yes:number; q_no:number }

export default function MarketPage(){
  const { id } = useParams<{ id: string }>()
  const [event,setEvent]=useState<Event|undefined>()
  const [state,setState]=useState<State|undefined>()
  const [orders,setOrders]=useState<{created_at:string; price_after:number}[]>([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{ if(!id) return; (async()=>{
    setLoading(true)
    const { data: ev } = await supabase.from('events').select('*').eq('id', id).single()
    setEvent(ev as any)
    const { data: st } = await supabase.from('lmsr_state').select('b,q_yes,q_no').eq('event_id', id).single()
    setState(st as any)
    const { data: ords } = await supabase.from('orders').select('created_at,price_after').eq('event_id', id).order('created_at', { ascending: true }).limit(1000)
    setOrders((ords??[]) as any)
    setLoading(false)
  })() },[id])

  const series = useMemo(()=>{
    const s = orders.map(o=>({ t:o.created_at, p:Number(o.price_after) }))
    if (s.length===0 && event && state){
      const b=Number(state.b), qy=Number(state.q_yes), qn=Number(state.q_no)
      const p = Math.exp(qy/b)/(Math.exp(qy/b)+Math.exp(qn/b))
      s.push({ t: event.created_at, p })
    }
    return s
  },[orders,event,state])

  if (loading || !event) return <div className="p-6">Loading…</div>

  const last = series.length ? (series[series.length-1].p*100).toFixed(1)+'%' : '—'

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          {event.description && <p className="text-sm text-neutral-400 mt-1">{event.description}</p>}
          <div className="mt-2 flex items-center gap-3">
            <LockBadge lockTime={event.lock_time} status={event.status} />
            <span className="text-xs text-neutral-500">Resolves: {new Date(event.resolve_time).toLocaleString()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">{last}</div>
          <div className="text-xs text-neutral-500">YES probability</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-3">
          <ProbChart data={series} />
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <OrderPad eventId={event.id} />
          <p className="text-xs text-neutral-500 mt-2">Points only. No money.</p>
        </div>
      </div>
    </div>
  )
}
