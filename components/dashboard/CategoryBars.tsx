'use client'

import { formatBRL } from '@/lib/format'
import ProgressBar from '@/components/ui/ProgressBar'

interface CategoryData {
  category: string
  spent: number
  limit: number
}

interface CategoryBarsProps {
  data: CategoryData[]
  weeklyMode?: boolean
}

export default function CategoryBars({ data, weeklyMode = false }: CategoryBarsProps) {
  const sorted = [...data].sort((a, b) => b.spent - a.spent).filter(d => d.spent > 0)

  if (sorted.length === 0) {
    return <p className="text-sm text-center py-4" style={{color:'#64748b'}}>Nenhum gasto no período</p>
  }

  return (
    <div className="space-y-3">
      {sorted.map(({ category, spent, limit }) => {
        const effectiveLimit = weeklyMode ? Math.round(limit / 4.33) : limit
        const pct = effectiveLimit > 0 ? (spent / effectiveLimit) * 100 : 0
        const color = pct < 85 ? '#34d399' : pct <= 100 ? '#fbbf24' : '#f87171'
        const remaining = effectiveLimit - spent

        return (
          <div key={category}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm" style={{color:'#cbd5e1'}}>{category}</span>
              <span className="text-xs font-medium" style={{color}}>{formatBRL(spent)} / {formatBRL(effectiveLimit)}</span>
            </div>
            <ProgressBar value={spent} max={effectiveLimit} />
            {pct > 85 && (
              <p className="text-xs text-right mt-0.5" style={{color:'#64748b'}}>
                {remaining >= 0 ? `${formatBRL(remaining)} restante` : `${formatBRL(Math.abs(remaining))} acima`}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
