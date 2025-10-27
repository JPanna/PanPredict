'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ProbChart({ data }: { data: { t: string; p: number }[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="t" hide />
          <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} width={42} />
          <Tooltip
            formatter={(v: any) => `${Math.round(Number(v) * 1000) / 10}%`}
            labelFormatter={(v) => new Date(v).toLocaleString()}
          />
          <Line type="monotone" dataKey="p" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
