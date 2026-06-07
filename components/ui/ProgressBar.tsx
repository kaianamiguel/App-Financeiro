interface ProgressBarProps {
  value: number
  max: number
  color?: 'green' | 'yellow' | 'red' | 'indigo'
}

export default function ProgressBar({ value, max, color }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const auto = color ?? (pct < 85 ? 'green' : pct <= 100 ? 'yellow' : 'red')

  const colors = {
    green: '#10b981',
    yellow: '#fbbf24',
    red: '#ef4444',
    indigo: '#6366f1',
  }

  return (
    <div className="h-2 rounded-full overflow-hidden" style={{background:'#334155'}}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: colors[auto] }}
      />
    </div>
  )
}
