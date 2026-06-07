'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatBRL } from '@/lib/format'

interface HistoryChartProps {
  data: { month: string; total: number }[]
}

export default function HistoryChart({ data }: HistoryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={55} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
        <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{background:'#1e293b', border:'1px solid #334155', borderRadius:8}} labelStyle={{color:'#cbd5e1'}} />
        <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total gasto" />
      </BarChart>
    </ResponsiveContainer>
  )
}
