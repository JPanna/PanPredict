'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'

type Pt = { ts: number; p: number } // ts = timestamp (ms), p = 0..1

function fmtLong(ts: number) {
  // e.g. "Nov 27, 2025, 12:34"
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtTick(ts: number) {
  // x-axis tick: "12:34"
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as Pt
  if (!d) return null

  return (
    <div
      style={{
        background: 'rgb(129, 230, 56)', // OKX lime
        color: '#000',
        padding: '10px 12px',
        borderRadius: 12,
        boxShadow: '0 6px 24px rgba(0,0,0,.4)',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <div style={{ marginBottom: 4 }}>{fmtLong(d.ts)}</div>
      <div>p: {(d.p * 100).toFixed(1)}%</div>
    </div>
  )
}

export default function ProbChart({ data }: { data: Pt[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="ts"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={fmtTick}
            stroke="#9BA3AF"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            dataKey="p"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            width={40}
            stroke="#9BA3AF"
            tick={{ fontSize: 12 }}
          />
          {/* Midline at 50% */}
          <ReferenceLine y={0.5} stroke="#1B1E24" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="p"
            stroke="#7CC7FF"
            strokeWidth={2}
            dot={{ r: 2, stroke: '#0B0C10', fill: '#7CC7FF' }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
