'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatBRL } from '@/lib/format'

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
  '#a78bfa', '#fb923c', '#34d399',
]

interface DonutChartProps {
  data: { category: string; spent: number }[]
}

export default function DonutChart({ data }: DonutChartProps) {
  const filtered = data.filter(d => d.spent > 0)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={filtered} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="spent" nameKey="category">
          {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{background:'#1e293b', border:'1px solid #334155', borderRadius:8}} labelStyle={{color:'#cbd5e1'}} />
        <Legend formatter={(v) => <span style={{fontSize:11, color:'#94a3b8'}}>{v}</span>} iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  )
}
